export default function ProfileSkeleton() {
  return (
    <div className="profile">
      <div className="header">
        <div className="profiler">
          <div className="p-wrapper">
            <div className="skeleton avatar"></div>
          </div>
        </div>

        <div className="skeleton title"></div>
        <div className="skeleton button small"></div>
      </div>

      <div className="userdetail">
        <div className="skeleton line"></div>
        <div className="skeleton line"></div>
        <div className="skeleton line"></div>
      </div>

      <div className="skeleton button"></div>
      <div className="skeleton button back"></div>
    </div>
  );
}