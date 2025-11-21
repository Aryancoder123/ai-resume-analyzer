import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta = () => {
  return [
    { title: "GetHired - Review" },
    { name: "description", content: "Detailed overview of your resume!" },
  ];
};

const ResumeById = () => {
  const { fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    const loadResume = async () => {
      if (!id) return;
      const resume = await kv.get(`resume ${id}`);
      if (!resume) return;
      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (resumeBlob) {
        const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
        setResumeUrl(URL.createObjectURL(pdfBlob));
      }

      const imageBlob = await fs.read(data.imagePath);
      if (imageBlob) {
        setImageUrl(URL.createObjectURL(imageBlob));
      }

      setFeedback(data.feedback);
    };

    loadResume();
  }, [id]);

  return (
    <main className="pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  title="resume"
                  className="h-full w-full object-contain rounded-2xl"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
        </section>
      </div>
    </main>
  );
};

export default ResumeById;
