export default function TitleCard({ visible, fadeOut }) {
  if (!visible) return null;
  return (
    <div className={`title-overlay${fadeOut ? ' fade-out' : ''}`}>
      <div className="title-card-box">
        <div className="title-logo-box">RK</div>
        <div className="title-app-name">Ravro Kanban</div>
        <div className="title-tagline">Your intelligent task board</div>
      </div>
    </div>
  );
}
