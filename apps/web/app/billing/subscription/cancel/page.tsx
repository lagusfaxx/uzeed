export default function SubscriptionCancelPage() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Suscripción cancelada</h2>
      <p>No se pudo completar la firma del mandato PAC o la cancelaste en el flujo del banco.</p>
      <div className="row">
        <a className="btn" href="/dashboard">Volver al dashboard</a>
      </div>
    </div>
  );
}
