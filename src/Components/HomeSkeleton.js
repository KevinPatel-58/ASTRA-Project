export default function HomeSkeleton() {
    return (
        <div className="home skeleton-wrapper">
        {/* Hero Skeleton */}
            <div className="hero">
                <div className="hero-text" style={{ width: '100%' }}>
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text"></div>
                </div>
                <div className="quick-stats">
                <div className="skeleton skeleton-stat"></div>
                <div className="skeleton skeleton-stat"></div>
                </div>
            </div>

            {/* Dashboard Placeholder (mimics your Dashboard component height) */}
            <div className="skeleton" style={{ height: '200px', marginBottom: '30px', marginRight: '20px' }}></div>

            <div className="home-grid">
                {/* Tasks Skeleton */}
                <div className="tasks-section">
                <div className="skeleton skeleton-text" style={{ marginBottom: '20px' }}></div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton skeleton-card"></div>
                ))}
                </div>

                {/* Right Panel Skeleton */}
                <div className="right-panel">
                <div className="assistant-box">
                    <div className="skeleton skeleton-circle"></div>
                    <div className="skeleton skeleton-text" style={{ margin: '15px auto 0', width: '80%' }}></div>
                </div>
                </div>
            </div>
        </div>
    )
}