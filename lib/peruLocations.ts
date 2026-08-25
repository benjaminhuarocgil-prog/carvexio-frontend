export const PERU_DEPARTMENTS = [
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
] as const;

export type DepartmentName = (typeof PERU_DEPARTMENTS)[number];

// Estructura de Provincias y Distritos principales por Departamento
export const PERU_LOCATIONS_DATA: Record<string, Record<string, string[]>> = {
  Lima: {
    Lima: [
      "Lima", "Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos",
      "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina",
      "La Victoria", "Lince", "Los Olivos", "Lurigancho-Chosica", "Lurín", "Magdalena del Mar",
      "Miraflores", "Pachacámac", "Pucosana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa",
      "Punta Negra", "Rímac", "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho",
      "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita",
      "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador",
      "Villa María del Triunfo"
    ],
    Cañete: [
      "San Vicente de Cañete", "Asia", "Calango", "Cerro Azul", "Coayllo", "Chilca",
      "Imperial", "Lunahuaná", "Mala", "Nuevo Imperial", "Pacarán", "Quilmaná", "San Antonio", "Santa Cruz de Flores", "Zúñiga"
    ],
    Huaral: [
      "Huaral", "Atavillos Alto", "Atavillos Bajo", "Aucallama", "Chancay", "Ihuarí",
      "Lampián", "Pacaraos", "San Miguel de Acos", "Santa Cruz de Andamarca", "Sumbilca", "Veintisiete de Noviembre"
    ],
    Huaura: [
      "Huacho", "Ambar", "Caleta de Carquín", "Checras", "Hualmay", "Leoncio Prado",
      "Paccho", "Santa Leonor", "Santa María", "Sayán", "Supe", "Supe Puerto", "Végueta"
    ],
    Barranca: ["Barranca", "Paramonga", "Pativilca", "Supe", "Supe Puerto"],
    Huarochirí: ["Matucana", "Antioquía", "Callahuanca", "Ricardo Palma", "San Mateo", "Santa Eulalia"],
    Canta: ["Canta", "Arahuay", "Huamantanga", "Santa Rosa de Quives"],
    Oyón: ["Oyón", "Andajes", "Pachangara"],
    Yauyos: ["Yauyos", "Alis", "Huancaya", "Laraos", "Tomas"]
  },
  Callao: {
    Callao: [
      "Callao", "Bellavista", "Carmen de la Legua-Reynoso", "La Perla", "La Punta", "Mi Perú", "Ventanilla"
    ]
  },
  Arequipa: {
    Arequipa: [
      "Arequipa", "Alto Selva Alegre", "Cayma", "Cerro Colorado", "Characato", "Chiguata",
      "Jacobo Hunter", "La Joya", "Mariano Melgar", "Miraflores", "Mollebaya", "Paucarpata",
      "Sabandía", "Sachaca", "Socabaya", "Tiabaya", "Uchumayo", "Yanahuara", "Yura"
    ],
    Camaná: ["Camaná", "José María Químper", "Mariano Nicolás Valcárcel", "Samuel Pastor"],
    Islay: ["Mollendo", "Cocachacra", "Dean Valdivia", "Mejía", "Punta de Bombón"],
    Caylloma: ["Chivay", "Achoma", "Maca", "Madrigal", "Yanque"]
  },
  "La Libertad": {
    Trujillo: [
      "Trujillo", "El Porvenir", "Florencia de Mora", "Huanchaco", "La Esperanza",
      "Laredo", "Moche", "Poroto", "Salaverry", "Simbal", "Victor Larco Herrera"
    ],
    Pacasmayo: ["San Pedro de Lloc", "Guadalupe", "Jequetepeque", "Pacasmayo", "San José"],
    Chepén: ["Chepén", "Pacanga", "Pueblo Nuevo"],
    "Sánchez Carrión": ["Huamachuco", "Chugay", "Curgos", "Marcabal", "Sanagorán"]
  },
  Lambayeque: {
    Chiclayo: [
      "Chiclayo", "Chongoyape", "Eten", "Eten Puerto", "José Leonardo Ortiz", "La Victoria",
      "Lagunas", "Monsefú", "Nueva Arica", "Oyotún", "Pimentel", "Reque", "Santa Rosa",
      "Saña", "Cayaltí", "Patapo", "Pomalca", "Pucalá", "Tuman"
    ],
    Lambayeque: [
      "Lambayeque", "Íllimo", "Jayanca", "Mochumí", "Mórrope", "Motupe", "Olmos", "Pacora", "Salas", "San José", "Túcume"
    ],
    Ferreñafe: ["Ferreñafe", "Cañaris", "Incahuasi", "Manuel Antonio Mesones Muro", "Pítipo", "Pueblo Nuevo"]
  },
  Piura: {
    Piura: [
      "Piura", "Castilla", "Catacaos", "Cura Mori", "El Taller", "La Arena", "La Unión",
      "Las Lomas", "Tambo Grande", "Veintiséis de Octubre"
    ],
    Sullana: ["Sullana", "Bellavista", "Ignacio Escudero", "Lancones", "Marcavelica", "Salitral"],
    Talara: ["Pariñas", "El Alto", "La Brea", "Lobitos", "Los Órganos", "Máncora"],
    Paita: ["Paita", "Amotape", "Arenal", "Colán", "La Huaca", "Tamarindo", "Vichayal"],
    Sechura: ["Sechura", "Bellavista de la Unión", "Bernal", "Cristo Nos Valga", "Vice"]
  },
  Cusco: {
    Cusco: [
      "Cusco", "Ccorca", "Poroy", "San Jerónimo", "San Sebastián", "Santiago", "Saylla", "Wanchaq"
    ],
    Urubamba: ["Urubamba", "Chinchero", "Huayllabamba", "Machupicchu", "Maras", "Ollantaytambo", "Yucay"],
    Calca: ["Calca", "Coya", "Lamay", "Lares", "Pisac", "San Salvador", "Taray", "Yanatile"],
    "La Convención": ["Santa Ana", "Echarate", "Huayopata", "Maranura", "Ocobamba", "Pichari", "Quellouno", "Vilcabamba"]
  },
  Junín: {
    Huancayo: [
      "Huancayo", "Carhuacallanga", "Chacapampa", "Chilca", "El Tambo", "Huancán",
      "Hualhuas", "Ingenio", "Pariahuanca", "Pilcomayo", "Pucará", "San Agustín", "San Jerónimo de Tunan", "Sapallanga", "Sicaya"
    ],
    Chanchamayo: ["La Merced", "Chanchamayo", "Perené", "Pichanaqui", "San Luis de Shuaro", "San Ramón"],
    Tarma: ["Tarma", "Acobamba", "Huaricolca", "Huasahuasi", "La Unión", "Palca", "Palcamayo", "San Pedro de Cajas", "Tatapampa"],
    Yauli: ["La Oroya", "Chacapalpa", "Huay-Huay", "Marcapomacocha", "Morococha", "Paccha", "Santa Bárbara de Carhuacayán", "Suitucancha", "Yauli"]
  },
  Ica: {
    Ica: [
      "Ica", "La Tinguiña", "Los Aquijes", "Ocucaje", "Pachacútec", "Parcona", "Pueblo Nuevo",
      "Salas", "San José de Los Molinos", "San Juan Bautista", "Santiago", "Subtanjalla", "Tate", "Yauca del Rosario"
    ],
    Chincha: [
      "Chincha Alta", "Alto Larán", "Chavín", "Chincha Baja", "El Carmen", "Grozio Prado",
      "Pueblo Nuevo", "San Juan de Yanac", "San Pedro de Huacarpana", "Sunampe", "Tambo de Mora"
    ],
    Pisco: ["Pisco", "Huancano", "Humay", "Independencia", "Paracas", "San Andrés", "San Clemente", "Túpac Amaru Inca"],
    Nasca: ["Nasca", "Changuillo", "El Ingenio", "Marcona", "Vista Alegre"],
    Palpa: ["Palpa", "Llipata", "Río Grande", "Santa Cruz", "Tibillo"]
  },
  Áncash: {
    Huaraz: ["Huaraz", "Cochabamba", "Colcabamba", "Huanchay", "Jangas", "La Libertad", "Oleros", "Pampas Grande", "Pariacoto", "Pira", "Tarica"],
    Santa: ["Chimbote", "Cáceres del Perú", "Coishco", "Nepeña", "Nuevo Chimbote", "Moro", "Samanco", "Santa"],
    Huaylas: ["Caraz", "Huata", "Huaylas", "Mato", "Pueblo Libre", "Santa Cruz", "Santo Toribio", "Yuracmarca"],
    Yungay: ["Yungay", "Cascapara", "Mancos", "Matacoto", "Quillo", "Ranrahirca", "Shupluy", "Yanama"]
  },
  Cajamarca: {
    Cajamarca: ["Cajamarca", "Asunción", "Chetilla", "Corao", "Encañada", "Jesús", "Llacanora", "Los Baños del Inca", "Magdalena", "Matara", "Namora", "San Juan"],
    Jaén: ["Jaén", "Bellavista", "Chontali", "Colasay", "Huabal", "Las Pirias", "Pucará", "Sallique", "San Felipe", "San José del Alto", "Santa Rosa"],
    Chota: ["Chota", "Anguía", "Chadin", "Chiguirip", "Chimban", "Choropampa", "Cochabamba", "Conchan", "Huambos", "Lajas", "Llama", "Miracosta", "Paccha", "Pion", "Querocoto", "San Juan de Licupis", "Tacabamba", "Tocmoche"]
  },
  "San Martín": {
    "San Martín": ["Tarapoto", "Alberto Leveau", "Cacatachi", "Chazuta", "Chipurana", "El Porvenir", "Huimbayoc", "Juan Guerra", "La Banda de Shilcayo", "Morales", "Papaplaya", "San Antonio", "Sauce", "Shapaja"],
    Moyobamba: ["Moyobamba", "Calzada", "Habana", "Jepelacio", "Soritor", "Yantaló"],
    Rioja: ["Rioja", "Awajún", "El Elías Soplin Vargas", "Nueva Cajamarca", "Pardo Miguel", "Posic", "San Fernando", "Yorongos"]
  },
  Tacna: {
    Tacna: ["Tacna", "Alto de la Alianza", "Calana", "Ciudad Nueva", "Incline", "Pachía", "Palca", "Pocollay", "Sama", "Coronel Gregorio Albarracín Lanchipa", "La Yarada Los Palos"],
    "Jorge Basadre": ["Locumba", "Ilabaya", "Ite"]
  },
  Puno: {
    Puno: ["Puno", "Acora", "Amantaní", "Atuncolla", "Capachica", "Chucuito", "Coata", "Huata", "Mañazo", "Paucarcolla", "Pichacani", "Platería", "San Antonio", "Tiquillaca", "Vilque"],
    "San Román": ["Juliaca", "Cabana", "Cabanillas", "Caracoto", "San Miguel"]
  },
  Huánuco: {
    Huánuco: ["Huánuco", "Amarilis", "Chinchao", "Churubamba", "Margos", "Quisqui", "San Francisco de Cayrán", "San Pedro de Chaulán", "Santa María del Valle", "Yarumayo", "Pillco Marca", "Yacus"],
    "Leoncio Prado": ["Tingo María", "Daniel Alomía Robles", "Hermilio Valdizán", "José Crespo y Castillo", "Luyando", "Mariano Dámaso Beraún"]
  },
  Loreto: {
    Maynas: ["Iquitos", "Alto Nanay", "Fernando Lores", "Indiana", "Las Amazonas", "Mazan", "Napo", "Punchana", "Torres Causana", "Belén", "San Juan Bautista"],
    "Alto Amazonas": ["Yurimaguas", "Balsa Puerto", "Jeberos", "Lagunas", "Santa Cruz", "Teniente César López Rojas"]
  },
  Ayacucho: {
    Huamanga: ["Ayacucho", "Acocro", "Acos Vinchos", "Carmen Alto", "Chiara", "Ocros", "Pacaycasa", "Quinua", "San José de Ticllas", "San Juan Bautista", "Santiago de Pischa", "Socos", "Tambillo", "Vinchos", "Jesús Nazareno"],
    Huanta: ["Huanta", "Ayahuanco", "Huamanguilla", "Iguain", "Luricocha", "Sivia", "Santillana"]
  },
  Ucayali: {
    "Coronel Portillo": ["Pucallpa", "Callería", "Campoverde", "Ipararía", "Masisea", "Yarinacocha", "Manantay"]
  }
};

/**
 * Obtener lista de provincias de un departamento.
 */
export function getProvinces(departmentName?: string | null): string[] {
  if (!departmentName) return [];
  const deptData = PERU_LOCATIONS_DATA[departmentName];
  if (deptData) {
    return Object.keys(deptData);
  }
  // Fallback si no está mapeado explícitamente
  return [departmentName];
}

/**
 * Obtener lista de distritos de una provincia y departamento.
 */
export function getDistricts(departmentName?: string | null, provinceName?: string | null): string[] {
  if (!departmentName || !provinceName) return [];
  const deptData = PERU_LOCATIONS_DATA[departmentName];
  if (deptData && deptData[provinceName]) {
    return deptData[provinceName];
  }
  // Fallback si no está mapeado explícitamente
  return [provinceName];
}

/**
 * Servicio de Geocodificación gratuito usando Nominatim OpenStreetMap
 */
export async function geocodeAddress(
  address: string,
  district?: string | null,
  province?: string | null,
  department?: string | null
): Promise<{ lat: number; lng: number } | null> {
  const parts = [address, district, province, department, "Perú"]
    .filter((p): p is string => Boolean(p && p.trim() !== ""));

  if (parts.length === 0) return null;

  const query = parts.join(", ");
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "es-PE,es;q=0.9",
        "User-Agent": "CarvexioAutomotriz/1.0",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.warn("No se pudo autocompletar las coordenadas desde Nominatim:", err);
  }
  return null;
}
