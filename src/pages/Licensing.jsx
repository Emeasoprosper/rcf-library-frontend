import TopAppBar from '../components/layout/TopAppBar'

function Licensing() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Licensing & Usage" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile flex flex-col gap-stack-lg">
        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">What You Can Do</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The RCF MOUAU Digital Library provides academic and fellowship resources to support learning, teaching, research, and spiritual growth within the RCF MOUAU community.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            You may read resources online, download materials for personal study, save items for offline access, and use them for coursework, assignments, projects, seminar preparation, Bible study, and personal development.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Responsible Use</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Resources in this library are intended for educational and ministry purposes within the RCF MOUAU community.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            Please respect authors, contributors, and copyright owners by using materials responsibly and giving proper attribution where required.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Contributing Resources</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Students, alumni, lecturers, and fellowship members are welcome to contribute valuable academic and fellowship resources through the Contribute section.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            Every submission is reviewed by library administrators before publication to ensure quality, relevance, and accuracy.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Copyright & Fair Use</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Only submit materials you own, have permission to share, or are authorized to distribute.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            Do not upload copyrighted content without permission, remove author credits, or claim ownership of another person's work.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Community Guidelines</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Help keep the library useful for everyone by submitting high-quality resources, reporting incorrect or outdated materials, and requesting resources that will benefit other members of the community.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            Together, we are building a reliable knowledge repository for present and future RCF MOUAU students.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Licensing
