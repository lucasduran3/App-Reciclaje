import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../hooks/useTickets";
import Card from "../components/common/Card";
import Avatar from "../components/common/Avatar";
import Badge from "../components/common/Badge";
import ProgressBar from "../components/common/ProgressBar";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

export default function UserProfile() {
  const { currentUser, loading } = useAuth();
  const { tickets: reportedTickets } = useTickets({
    reportedBy: currentUser?.id,
  });
  const { tickets: cleanedTickets } = useTickets({
    acceptedBy: currentUser?.id,
  });

  if (loading || !currentUser) {
    return <Loader fullScreen text="Cargando perfil..." />;
  }

  const nextLevelPoints = getNextLevelPoints(currentUser.level);
  const progressToNextLevel =
    ((currentUser.points % nextLevelPoints) / nextLevelPoints) * 100;

  return (
    <div className="page profile-page">
      {/* Profile Header */}
      <Card className="profile-header">
        <div className="profile-avatar-section">
          <Avatar
            src={currentUser.avatar}
            alt={currentUser.name}
            size="xlarge"
            badge={currentUser.level}
          />
          <div className="profile-info">
            <h1 className="profile-name">{currentUser.name}</h1>
            <p className="profile-email">{currentUser.email}</p>
            <div className="profile-badges-preview">
              <Badge variant="primary" icon="⭐">
                {currentUser.points} puntos
              </Badge>
              <Badge variant="secondary" icon="📊">
                Nivel {currentUser.level}
              </Badge>
              {currentUser.streak > 0 && (
                <Badge variant="warning" icon="🔥">
                  {currentUser.streak} días
                </Badge>
              )}
              <Badge variant="default" icon="📍">
                {currentUser.zone}
              </Badge>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <Button variant="ghost" icon="⚙️">
            Configuración
          </Button>
        </div>
      </Card>

      {/* Level Progress */}
      <Card>
        <h3 className="card-title">📊 Progreso de Nivel</h3>
        <ProgressBar
          current={currentUser.points % nextLevelPoints}
          max={nextLevelPoints}
          label={`Nivel ${currentUser.level} → Nivel ${currentUser.level + 1}`}
          variant="primary"
          size="large"
        />
        <p className="progress-text">
          Te faltan {nextLevelPoints - (currentUser.points % nextLevelPoints)}{" "}
          puntos para el próximo nivel
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <Card className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-value">
              {currentUser.stats.ticketsReported}
            </div>
            <div className="stat-label">Tickets Reportados</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">✋</div>
          <div className="stat-content">
            <div className="stat-value">
              {currentUser.stats.ticketsAccepted}
            </div>
            <div className="stat-label">Tickets Aceptados</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{currentUser.stats.ticketsCleaned}</div>
            <div className="stat-label">Tickets Limpiados</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <div className="stat-value">
              {currentUser.stats.ticketsValidated}
            </div>
            <div className="stat-label">Tickets Validados</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">
              {currentUser.stats.missionsCompleted}
            </div>
            <div className="stat-label">Misiones Completadas</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-value">{currentUser.stats.likesReceived}</div>
            <div className="stat-label">Likes Recibidos</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">
              {currentUser.stats.commentsReceived}
            </div>
            <div className="stat-label">Comentarios Recibidos</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{currentUser.badges.length}</div>
            <div className="stat-label">Insignias Obtenidas</div>
          </div>
        </Card>
      </div>
      {/* Badges Collection */}
      <Card>
        <h3 className="card-title">🏆 Insignias</h3>
        {currentUser.badges.length > 0 ? (
          <div className="badges-grid">
            {currentUser.badges.map((badge) => (
              <div key={badge} className="badge-item">
                <div className="badge-icon">{getBadgeIcon(badge)}</div>
                <div className="badge-name">{badge}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-message">
            Aún no tienes insignias. ¡Completa misiones para obtenerlas!
          </p>
        )}
      </Card>
      {/* Activity Summary */}
      <div className="profile-activity">
        <Card>
          <h3 className="card-title">📍 Mis Reportes</h3>
          <div className="activity-stats">
            <p>
              <strong>{reportedTickets.length}</strong> tickets reportados
            </p>
            <p>
              <strong>
                {reportedTickets.filter((t) => t.status === "completed").length}
              </strong>{" "}
              completados
            </p>
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => (window.location.href = "/feed")}
          >
            Ver todos mis reportes →
          </Button>
        </Card>
        <Card>
          <h3 className="card-title">🧹 Mis Limpiezas</h3>
          <div className="activity-stats">
            <p>
              <strong>{cleanedTickets.length}</strong> tickets aceptados
            </p>
            <p>
              <strong>
                {cleanedTickets.filter((t) => t.status === "completed").length}
              </strong>{" "}
              completados
            </p>
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => (window.location.href = "/feed")}
          >
            Ver todas mis limpiezas →
          </Button>
        </Card>
      </div>
    </div>
  );
}
// Helper functions
function getNextLevelPoints(level) {
  if (level < 2) return 50;
  if (level < 4) return 200;
  if (level < 6) return 500;
  if (level < 8) return 1000;
  return 2000;
}
function getBadgeIcon(badgeName) {
  const icons = {
    Constante: "🎖️",
    Comprometido: "🏅",
    Dedicado: "🥇",
    Imparable: "💪",
    "Leyenda Verde": "👑",
  };
  return icons[badgeName] || "🏆";
}
