import SectionTitle from "~/components/landing/SectionTitle";

interface Props {
  id: string;
  title: string;
  description: string;
}

const Section: React.FC<React.PropsWithChildren<Props>> = ({
  id,
  title,
  description,
  children,
}) => {
  return (
    <section id={id} className="py-10 lg:py-20">
      <SectionTitle>
        <h2 className="mb-4 text-center">{title}</h2>
      </SectionTitle>
      <p className="mb-12 text-center">{description}</p>
      {children}
    </section>
  );
};

export default Section;
