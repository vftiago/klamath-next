import Link from "next/link";

const AboutPage = () => {
  return (
    <div className="flex flex-col gap-10 p-2">
      <h1 className="text-2xl">
        <Link href="/">Home</Link> / About
      </h1>
      <div className="flex flex-col gap-6 text-lg">
        <p>I&apos;m a software engineer by trade.</p>
        <p>The web is my domain, frontend is my speciality, React and TypeScript are my main tools.</p>
        <p>
          For better or worse, I did not follow the beaten path. After a brief career in management I decided to pivot
          to software development by taking on projects as a freelancer and crafting a robust personal portfolio. During
          my years in management I have honed my ability to communicate effectively within global business structures,
          and internationally connected organizations.
        </p>
        <p>
          I have have studied, worked and lived in China, The Netherlands, Mexico, Poland and Portugal, where I
          currently reside.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
