import { useState, useEffect } from "react"; // <--- ESTA ES LA LÍNEA CLAVE
import { supabase } from "./lib/supabase";
import { Lock, User, Beer } from "lucide-react";

// 1. Definimos las formas de los datos (Interfaces)
interface Bar {
  id: string;
  nombre: string;
  activo: boolean;
  fecha_vencimiento: string;
}

interface Perfil {
  nombre: string;
  rol: string;
  activo: boolean;
  bares: Bar;
}

interface Sector {
  id: string;
  nombre: string;
}

interface Mesa {
  id: string;
  nombre_referencia: string;
  estado: 'libre' | 'ocupada' | 'reservada' | 'sucia';
  sector_id: string;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Perfil | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);

  const cargarDatosBar = async (barId: string) => {
  // Traer sectores
  const { data: secData } = await supabase
    .from('sectores')
    .select('*')
    .eq('bar_id', barId);
  
  // Traer mesas
  const { data: mesaData } = await supabase
    .from('mesas')
    .select('*');

  if (secData) setSectores(secData);
  if (mesaData) setMesas(mesaData);
};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // A. Autenticación
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !user) {
      alert("Usuario o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // B. Consulta de Perfil y Bar
    const { data, error: perfilError } = await supabase
      .from('perfiles')
      .select(`
        nombre, 
        rol, 
        activo,
        bares (id, nombre, activo, fecha_vencimiento)
      `)
      .eq('id', user.id)
      .single();

    // Forzamos el tipado para que VS Code no marque error
    const perfil = data as any as Perfil;

    if (perfilError || !perfil) {
      alert("No se encontró el perfil del mozo.");
      setLoading(false);
      return;
    }

    // C. Validaciones SaaS (Bar y Usuario)
    const hoy = new Date();
    const vencimiento = new Date(perfil.bares.fecha_vencimiento);

    if (!perfil.activo) {
      alert("Tu usuario está desactivado.");
      setLoading(false);
      return;
    }

    if (!perfil.bares.activo || hoy > vencimiento) {
      alert(`El servicio para "${perfil.bares.nombre}" está vencido o suspendido.`);
      setLoading(false);
      return;
    }

    // D. Éxito
    alert(`¡Bienvenido ${perfil.nombre}! Entrando a ${perfil.bares.nombre}`);
    setUserProfile(perfil);
    setLoading(false);
  };

useEffect(() => {
  if (userProfile) {
    cargarDatosBar(userProfile.bares.id);
  }
}, [userProfile]);

// Reemplaza el bloque "if (userProfile)" por este:
if (userProfile) {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{userProfile.bares.nombre}</h1>
          <p style={{ color: '#666' }}>Mozo: {userProfile.nombre}</p>
        </div>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}>
          Salir
        </button>
      </header>

      {sectores.map(sector => (
        <div key={sector.id} style={{ marginBottom: '40px' }}>
          <h2 style={{ borderBottom: '2px solid #f59e0b', display: 'inline-block', paddingBottom: '5px' }}>
            {sector.nombre}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '20px', marginTop: '15px' }}>
            {mesas.filter(m => m.sector_id === sector.id).map(mesa => (
              <div 
                key={mesa.id} 
                style={{ 
                  padding: '20px', 
                  borderRadius: '10px', 
                  backgroundColor: mesa.estado === 'libre' ? '#dcfce7' : '#fee2e2',
                  border: `2px solid ${mesa.estado === 'libre' ? '#22c55e' : '#ef4444'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {mesa.nombre_referencia}
                <div style={{ fontSize: '10px', marginTop: '5px', textTransform: 'uppercase' }}>
                  {mesa.estado}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Beer size={48} color="#f59e0b" />
          <h1 style={{ margin: '10px 0' }}>BarMaster POS</h1>
          <p style={{ color: '#666' }}>Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <User size={20} style={styles.icon} />
            <input 
              type="email" 
              placeholder="Email" 
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <Lock size={20} style={styles.icon} />
            <input 
              type="password" 
              placeholder="Contraseña" 
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Verificando..." : "Entrar al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' },
  inputGroup: { display: 'flex', alignItems: 'center', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', padding: '5px 10px' },
  icon: { color: '#999', marginRight: '10px' },
  input: { border: 'none', outline: 'none', width: '100%', padding: '8px' },
  button: { width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;