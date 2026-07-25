import './MobileBlocker.css';

const MobileBlocker = () => {
  return (
    <div className="mobile-blocker">
      <div className="mobile-blocker-content">
        <h1 className="mobile-blocker-title silver-glow-text">DESKTOP REQUIRED</h1>
        <p className="mobile-blocker-desc">
          This portfolio is a highly interactive 3D web experience designed specifically for a mouse and keyboard.
        </p>
        <p className="mobile-blocker-sub">
          Please revisit on a desktop or laptop device for the full experience.
        </p>
      </div>
    </div>
  );
};

export default MobileBlocker;
