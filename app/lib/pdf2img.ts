export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;
  // Try to import pdfjs and handle both default and named exports
  // @ts-expect-error - pdfjs-dist may not have perfect TS typings for this import
  loadPromise = import("pdfjs-dist/build/pdf.mjs")
    .then((mod) => {
      const lib = (mod && (mod.default ?? mod)) as any;
      // Prefer a worker that matches the runtime pdfjs version.
      // If `lib.version` is available, point to the matching worker on the CDN.
      // Otherwise fall back to the local copy in `public/`.
      const workerUrl = lib?.version
        ? `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`
        : "/pdf.worker.min.mjs";
      if (lib && lib.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = workerUrl;
      }
      pdfjsLib = lib;
      isLoading = false;
      return lib;
    })
    .catch((err) => {
      // Fallback: try the legacy build path
      // @ts-expect-error
      return import("pdfjs-dist/legacy/build/pdf").then((mod) => {
        const lib = (mod && (mod.default ?? mod)) as any;
        const workerUrl = lib?.version
          ? `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`
          : "/pdf.worker.min.mjs";
        if (lib && lib.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = workerUrl;
        }
        pdfjsLib = lib;
        isLoading = false;
        return lib;
      });
    });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // use a moderate scale to avoid creating huge canvases which can OOM
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Failed to get 2D rendering context for canvas",
      };
    }

    context.imageSmoothingEnabled = true;
    // @ts-ignore - the string union may differ across browsers/TS versions
    context.imageSmoothingQuality = "high";

    await page.render({ canvasContext: context!, viewport }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the blob with the same name as the pdf
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0
      ); // Set quality to maximum (1.0)
    });
  } catch (err) {
    // Log the error so it's visible in the browser console for debugging
    // and return a structured error to the caller.
    console.error("convertPdfToImage error:", err);
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
