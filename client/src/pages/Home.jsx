import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../hooks/useTickets";
import { useMissions } from "../hooks/useMissions";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import ProgressBar from "../components/common/ProgressBar";
import TicketCard from "../components/tickets/TicketCard";
import MissionCard from "../components/missions/MissionCard";
import Loader from "../components/common/Loader";
import { Icon } from "@iconify/react";

export default function Home() {
  const { currentUser } = useAuth();
  const { tickets, loading: ticketsLoading } = useTickets({
    status: "reported",
    limit: 3,
  });
  const { missions, loading: missionsLoading } = useMissions({
    completed: "false",
    limit: 3,
  });

  if (!currentUser) {
    return <Loader fullScreen text="Cargando..." />;
  }

  const activeMissions = missions.filter((m) => !m.completed && new Date(m.expiredAt)).slice(0, 3);
  const recentTickets = tickets.slice(0, 3);

  return (
    <div className="page home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <h1 className="home-title">¡Hola, {currentUser.name.split(" ")[0]}!</h1>
        <p className="home-subtitle">
          Sigamos haciendo de nuestra ciudad un lugar más limpio
        </p>
      </section>

      {/* Stats Overview */}
      <section className="home-stats">
        <Card className="stat-card">
          <div className="stat-icon">
            <Icon icon="fluent-color:star-48"></Icon>
          </div>
          <div className="stat-content">
            <div className="stat-value">{currentUser.points}</div>
            <div className="stat-label">Puntos Totales</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <Icon icon="fluent-color:data-bar-vertical-ascending-24"></Icon>
          </div>
          <div className="stat-content">
            <div className="stat-value">Nivel {currentUser.level}</div>
            <div className="stat-label">Nivel Actual</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <Icon icon="fluent-emoji-flat:fire"></Icon>
          </div>
          <div className="stat-content">
            <div className="stat-value">{currentUser.streak}</div>
            <div className="stat-label">Días de Racha</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">
            <Icon icon="fluent-color:trophy-48"></Icon>
          </div>
          <div className="stat-content">
            <div className="stat-value">{currentUser.badges.length}</div>
            <div className="stat-label">Insignias</div>
          </div>
        </Card>
      </section>

      {/* Quick Actions */}
      <section className="home-section">
        <h2 className="section-title">Acciones Rápidas</h2>
        <div className="quick-actions">
          <Button
            variant="primary"
            size="large"
            icon=<Icon icon="fluent-color:clipboard-text-edit-32"></Icon>
            onClick={() => (window.location.href = "/tickets/new")}
          >
            Reportar Punto Sucio
          </Button>
          <Button
            variant="secondary"
            size="large"
            icon=<Icon icon="fluent-emoji-flat:world-map"></Icon>
            onClick={() => (window.location.href = "/map")}
          >
            Ver Mapa
          </Button>
          <Button
            variant="ghost"
            size="large"
            icon=<Icon icon="fluent-color:pin-48"></Icon>
            onClick={() => (window.location.href = "/missions")}
          >
            Mis Misiones
          </Button>
        </div>
      </section>

      {/* Active Missions */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title"><Icon icon="fluent-color:pin-48"></Icon> Misiones Activas</h2>
          <Link to="/missions" className="section-link">
            Ver todas →
          </Link>
        </div>
        {missionsLoading ? (
          <Loader text="Cargando misiones..." />
        ) : activeMissions.length > 0 ? (
          <div className="home-missions">
            {activeMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="empty-message">
              No hay misiones activas en este momento
            </p>
          </Card>
        )}
      </section>

      {/* Recent Tickets */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title"><Icon icon="fluent-color:news-28"></Icon> Tickets Recientes</h2>
          <Link to="/feed" className="section-link">
            Ver todos →
          </Link>
        </div>
        {ticketsLoading ? (
          <Loader text="Cargando tickets..." />
        ) : recentTickets.length > 0 ? (
          <div className="home-tickets">
            {recentTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                users={[currentUser]}
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="empty-message">No hay tickets disponibles</p>
          </Card>
        )}
      </section>

      {/* User Progress */}
      <section className="home-section">
        <Card>
          <h3 className="card-section-title"><Icon icon="fluent-color:data-trending-48"></Icon> Tu Progreso</h3>
          <div className="progress-section">
            <ProgressBar
              current={currentUser.stats.ticketsReported}
              max={50}
              label="Tickets Reportados"
              variant="primary"
            />
            <ProgressBar
              current={currentUser.stats.ticketsCleaned}
              max={30}
              label="Tickets Limpiados"
              variant="success"
            />
            <ProgressBar
              current={currentUser.stats.missionsCompleted}
              max={20}
              label="Misiones Completadas"
              variant="warning"
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
