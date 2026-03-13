const Logos: React.FC = () => {
  return (
    <section id="logos" className="bg-background px-5 py-32">
      <p className="text-center text-lg font-medium">
        Trusted by <span className="text-primary">CRE teams</span> and brokers
        worldwide
      </p>
      <div className="logos-container mt-5 flex w-full flex-row flex-wrap items-center justify-evenly gap-5 opacity-45 sm:gap-10">
        {/* Placeholder: replace with your partner logos or remove section */}
        <div className="h-10 w-24 rounded bg-gray-200 sm:h-12" />
        <div className="h-10 w-24 rounded bg-gray-200 sm:h-12" />
        <div className="h-10 w-24 rounded bg-gray-200 sm:h-12" />
      </div>
    </section>
  );
};

export default Logos;
