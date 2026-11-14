import './MobileBlocker.css';

const MobileBlocker = () => {
  return (
    <main className="mobile-blocker">
      <div className="mobile-blocker-content">
        <h1 className="mobile-blocker-title silver-glow-text">DESKTOP REQUIRED</h1>
        <p className="mobile-blocker-desc">
          This portfolio is a highly interactive 3D web experience designed specifically for a mouse and keyboard.
        </p>
        <p className="mobile-blocker-sub">
          Please revisit on a desktop or laptop device for the full experience.
        </p>
        {/* Visitors on a phone still get a way to reach out. */}
        <nav className="mobile-blocker-links" aria-label="Contact">
          <a href="mailto:imshreyaskn@gmail.com">email</a>
          <a href="https://github.com/imshreyaskn" target="_blank" rel="noopener noreferrer">github</a>
          <a href="https://linkedin.com/in/imshreyaskn" target="_blank" rel="noopener noreferrer">linkedin</a>
          <a href="https://drive.google.com/file/d/1jZAk3dqG7K3nCe5UGeCSA_4Kwz26lsSM/view?usp=sharing" target="_blank" rel="noopener noreferrer">resume</a>
        </nav>
      </div>
    </main>
  );
};

export default MobileBlocker;
