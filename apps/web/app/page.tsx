export default function Page() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>UZEED — Only MVP</h1>
      <p>Demo funcional: registro/login, paywall, feed, admin posts y renovación mensual manual vía Khipu.</p>
      <div className="row">
        <a className="btn" href="/feed">Ver feed</a>
        <a className="btn secondary" href="/register">Crear cuenta</a>
      </div>
      <p className="small" style={{ marginTop: 12 }}>
        Para crear posts entra con <b>admin@uzeed.cl</b> / <b>Admin1234!</b> (cambiar en producción).
      </p>
    </div>
  );
}
