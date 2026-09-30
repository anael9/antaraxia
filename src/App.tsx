import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { deletePatientRecords, emptyPatientRecords, fetchPatientRecords, type PatientRecords } from './lib/patientRecords'
import type { Database } from './lib/database.types'
import { supabase, supabaseConfigured } from './lib/supabase'

type AppointmentRequest = Database['public']['Tables']['appointment_requests']['Row']
const WELLNESS_STAFF_EMAIL = 'kathia.aguilar@ulv.edu.mx'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return String(error)
}

function getPublicStatsErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'PGRST202') {
    return 'Aplica la migración supabase/migrations/20260930130000_add_dynamic_wellness_statistics.sql en Supabase para activar estas cifras.'
  }
  return getErrorMessage(error)
}

type IconName =
  | 'leaf' | 'menu' | 'close' | 'arrow' | 'check' | 'heart' | 'brain'
  | 'nurse' | 'people' | 'shield' | 'search' | 'clock' | 'play'
  | 'video' | 'building' | 'mail' | 'phone' | 'pin' | 'instagram'
  | 'linkedin' | 'sun' | 'sparkles' | 'wind' | 'chevron'
  | 'pause' | 'restart' | 'user' | 'logout' | 'download' | 'trash' | 'lock'

function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true as const,
  }

  const shapes: Record<IconName, ReactNode> = {
    leaf: <><path d="M20.8 3.2C12 3.5 6 5.5 6 12.5a5 5 0 0 0 5 5c7 0 9-6 9.8-14.3Z" /><path d="M3 21c2-5 6-9 12-12" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    brain: <><path d="M12 18V5a3 3 0 0 0-5.8-1A3.5 3.5 0 0 0 4 10.5 3.5 3.5 0 0 0 6 17a3 3 0 0 0 6 1Z" /><path d="M12 18V5a3 3 0 0 1 5.8-1 3.5 3.5 0 0 1 2.2 6.5A3.5 3.5 0 0 1 18 17a3 3 0 0 1-6 1Z" /><path d="M8 8h.01M16 8h.01M8 14h.01M16 14h.01" /></>,
    nurse: <><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="9" /><path d="M8 3.5V2m8 1.5V2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    building: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 12h.01M15 12h.01" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.9L7.7 9.7a16 16 0 0 0 6.6 6.6l1.3-1.3a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2Z" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
    linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 2l.7 1.3L7 4l-1.3.7L5 6l-.7-1.3L3 4l1.3-.7L5 2Z" /></>,
    wind: <><path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h6a3 3 0 1 1-3 3" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    pause: <><path d="M8 5v14" /><path d="M16 5v14" /></>,
    restart: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /><path d="M12 14v3" /></>,
  }

  return <svg {...common}>{shapes[name]}</svg>
}

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Mi cuenta', href: '#cuenta' },
  { label: 'Evaluación', href: '#evaluación' },
  { label: 'Técnicas', href: '#técnicas' },
  { label: 'Atención', href: '#atención' },
]

const resources = [
  { title: 'Cuando la ansiedad toma el control', category: 'Ansiedad', description: 'Entiende cómo funciona la ansiedad y aprende herramientas para recuperar la calma.', time: '5 min', icon: 'wind' as const, intro: 'La ansiedad es una respuesta del cuerpo ante algo que percibe como un desafío o una amenaza. Puede sentirse como inquietud, pensamientos acelerados o tensión física. Aunque puede ser incómoda, hay formas de atravesar ese momento con cuidado.', tips: ['Apoya los pies en el suelo y nombra lentamente cinco cosas que ves.', 'Exhala despacio; intenta que cada exhalación dure un poco más que la inhalación.', 'Divide lo que te preocupa en un paso pequeño y concreto que puedas hacer ahora.'], support: 'Si la ansiedad interfiere de manera constante con tu descanso, tus estudios o tus relaciones, conversar con Bienestar Universitario puede ayudarte.' },
  { title: 'No tienes que poder con todo', category: 'Depresión', description: 'Señales importantes, pequeños pasos y cómo encontrar apoyo cuando más lo necesitas.', time: '7 min', icon: 'heart' as const, intro: 'Sentirse decaído, sin energía o con menos interés puede hacer que hasta las tareas cotidianas parezcan difíciles. No es una falta de voluntad y no tienes que resolverlo todo de una vez.', tips: ['Elige una tarea amable y pequeña: tomar agua, abrir la ventana o ducharte.', 'Cuéntale a alguien de confianza cómo te has estado sintiendo.', 'Intenta mantener una rutina sencilla de descanso y alimentación, sin exigirte perfección.'], support: 'Si este estado persiste, empeora o te cuesta desenvolverte en el día a día, busca acompañamiento profesional. Si estás en peligro inmediato, llama al 123.' },
  { title: 'Estrés académico: una guía amable', category: 'Estrés', description: 'Estrategias realistas para organizarte, pausar y cuidar de ti en época de exámenes.', time: '6 min', icon: 'brain' as const, intro: 'El estrés puede aparecer cuando sientes que las demandas superan el tiempo o los recursos que tienes. En la universidad, organizarte con flexibilidad y hacer pausas también forma parte de estudiar.', tips: ['Anota tus pendientes y escoge una prioridad para empezar, no todas a la vez.', 'Prueba bloques de estudio cortos con pausas para estirar y tomar agua.', 'Deja espacio para descansar: recuperarte ayuda a sostener la concentración.'], support: 'Si el estrés se siente inmanejable o afecta tu salud, habla con alguien de confianza o solicita orientación en Bienestar Universitario.' },
  { title: 'Dormir bien también se aprende', category: 'Sueño', description: 'Rutinas sencillas que preparan tu cuerpo y mente para un descanso reparador.', time: '4 min', icon: 'sun' as const, intro: 'El sueño influye en el ánimo, la memoria y la energía. Los horarios de estudio, las preocupaciones y los cambios de rutina pueden alterarlo; pequeños hábitos pueden ayudar a crear condiciones más favorables para descansar.', tips: ['Intenta acostarte y levantarte a horas parecidas cuando sea posible.', 'Antes de dormir, reduce gradualmente las pantallas y las actividades estimulantes.', 'Si no concilias el sueño, prueba una actividad tranquila y vuelve a la cama cuando te sientas con sueño.'], support: 'Si las dificultades para dormir son frecuentes o afectan tu funcionamiento durante el día, consulta a un profesional de salud.' },
  { title: 'Recupera tu foco, paso a paso', category: 'Concentración', description: 'Prácticas breves para volver al presente y avanzar sin exigir perfección.', time: '5 min', icon: 'sparkles' as const, intro: 'La concentración puede variar según tu descanso, tu entorno y lo que estés atravesando. Distraerte no significa que estés fallando; puedes volver a la tarea con curiosidad y ajustar el siguiente paso.', tips: ['Define una tarea concreta y hazla más pequeña: por ejemplo, leer dos páginas.', 'Guarda el teléfono fuera de tu alcance durante un bloque corto de trabajo.', 'Cuando notes que te distrajiste, reconoce la distracción y vuelve sin reprocharte.'], support: 'Si la dificultad para concentrarte es persistente o te preocupa, puede servir conversar sobre ello con un profesional.' },
  { title: 'Háblate como hablarías a un amigo', category: 'Autoestima', description: 'Una invitación a reconocer tu valor más allá de tus logros y resultados.', time: '6 min', icon: 'heart' as const, intro: 'La autoestima no depende de ser perfecto ni de alcanzar cada meta. También crece cuando reconoces tus esfuerzos y te tratas con respeto en los días difíciles.', tips: ['Nota cómo te hablas cuando algo no sale como esperabas.', 'Cambia una crítica absoluta por una descripción más justa y específica.', 'Haz una lista de cualidades, vínculos o momentos que valores en ti, aunque sean pequeños.'], support: 'Si la autocrítica te causa mucho malestar o afecta tus relaciones, pedir apoyo es un paso válido.' },
  { title: 'Relaciones que se sienten seguras', category: 'Relaciones', description: 'Límites saludables, comunicación y vínculos que acompañan tu crecimiento.', time: '8 min', icon: 'people' as const, intro: 'Los vínculos saludables permiten expresar necesidades, escuchar y mantener límites. Cada relación es distinta; puedes avanzar a tu ritmo y decidir qué te hace sentir respetado y seguro.', tips: ['Expresa lo que necesitas con frases claras y en primera persona.', 'Practica decir que no a una petición cuando no te sientas cómodo/a.', 'Busca momentos tranquilos para conversar y escucha sin asumir que ya conoces la respuesta.'], support: 'Si una relación te hace sentir inseguro/a o controlado/a, habla con alguien de confianza o busca apoyo profesional.' },
  { title: 'Si hoy todo se siente demasiado', category: 'Crisis', description: 'Pasos inmediatos para buscar apoyo y acompañamiento en un momento difícil.', time: '3 min', icon: 'shield' as const, intro: 'En un momento de crisis, no tienes que resolver todo ni estar a solas. Lo primero es acercarte a alguien que pueda acompañarte y ponerte en un lugar donde te sientas más seguro/a.', tips: ['Contacta a una persona de confianza y dile directamente que necesitas compañía.', 'Aléjate de cualquier situación u objeto que pueda ponerte en riesgo.', 'Concéntrate en el siguiente paso inmediato: pedir ayuda, llegar a un espacio seguro o llamar a una línea de apoyo.'], support: 'Si tú u otra persona están en peligro inmediato, llama al 123. Para apoyo en crisis estudiantil, llama al 115.' },
]

const symptoms = ['Ansiedad', 'Depresión', 'Estrés', 'Sueño', 'Concentración', 'Autoestima', 'Relaciones', 'Crisis']

const questions = [
  '¿Con qué frecuencia te has sentido nervioso/a, ansioso/a o al límite?',
  '¿Con qué frecuencia has tenido dificultades para dejar de preocuparte?',
  '¿Con qué frecuencia has sentido poco interés o placer en hacer cosas?',
  '¿Con qué frecuencia te has sentido decaído/a, deprimido/a o sin esperanza?',
  '¿Con qué frecuencia el estrés ha interferido con tus estudios o descanso?',
  '¿Con qué frecuencia has sentido que necesitas apoyo para cuidar tu bienestar?',
]
const answerOptions = [
  { label: 'Nunca', score: 0 },
  { label: 'Algunos días', score: 1 },
  { label: 'Más de la mitad de los días', score: 2 },
  { label: 'Casi todos los días', score: 3 },
]

const disciplines = [
  { icon: 'brain' as const, title: 'Psicología Clínica', description: 'Acompañamiento psicológico profesional, cercano y confidencial.' },
  { icon: 'nurse' as const, title: 'Enfermería', description: 'Orientación integral para cuidar tu salud física y emocional.' },
  { icon: 'people' as const, title: 'Abordaje Social', description: 'Conectamos contigo, tu entorno y los recursos de tu comunidad.' },
  { icon: 'shield' as const, title: 'Prevención Activa', description: 'Herramientas prácticas para fortalecer tu bienestar cada día.' },
]

type BreathingTab = 'Respiración' | 'Mindfulness' | 'Relajación Muscular'
type Modality = 'virtual' | 'presencial'

const modalityLabels: Record<Modality, string> = {
  virtual: 'Atención Virtual',
  presencial: 'Atención Presencial',
}

const breathingTabs: { label: BreathingTab; icon: IconName }[] = [
  { label: 'Respiración', icon: 'wind' },
  { label: 'Mindfulness', icon: 'sparkles' },
  { label: 'Relajación Muscular', icon: 'heart' },
]

const breathingContent: Record<BreathingTab, { title: string; description: string; steps: string[] }> = {
  Respiración: {
    title: 'Respiración en caja',
    description: 'Una pausa consciente para soltar la tensión y volver al momento presente.',
    steps: ['Inhala suavemente por la nariz', 'Sostén el aire con calma', 'Exhala lento por la boca', 'Descansa antes de comenzar'],
  },
  Mindfulness: {
    title: 'Vuelve a este momento',
    description: 'Regálate un minuto para observar tus sentidos, sin juicios ni exigencias.',
    steps: ['Nombra 5 cosas que puedes ver', 'Nota 4 sensaciones en tu cuerpo', 'Escucha 3 sonidos a tu alrededor', 'Respira y agradece esta pausa'],
  },
  'Relajación Muscular': {
    title: 'Suelta, poco a poco',
    description: 'Recorre tu cuerpo con atención y permite que cada grupo muscular descanse.',
    steps: ['Tensa suavemente hombros y manos', 'Sostén unos segundos, sin forzar', 'Suelta al exhalar despacio', 'Avanza por el resto de tu cuerpo'],
  },
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#inicio" className={`flex shrink-0 items-center justify-center ${light ? 'rounded-xl bg-white px-1.5 py-1' : ''}`} aria-label="Ataraxia, inicio">
      <img
        src={`${import.meta.env.BASE_URL}ataraxia-logo.png`}
        alt="Ataraxia · Bienestar digital, paz mental, equilibrio"
        className={`object-contain ${light ? 'h-16 w-28' : 'h-14 w-[88px]'}`}
      />
    </a>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cbfbf1] bg-[#f0fdfc] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#00786f]">{children}</span>
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [patientRecords, setPatientRecords] = useState<PatientRecords>(emptyPatientRecords)
  const [publicStats, setPublicStats] = useState<{ studentsAttended: number | null; satisfactionPercent: number | null; satisfactionResponses: number }>({
    studentsAttended: null,
    satisfactionPercent: null,
    satisfactionResponses: 0,
  })
  const [publicStatsError, setPublicStatsError] = useState('')
  const [staffAppointments, setStaffAppointments] = useState<AppointmentRequest[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffBusyId, setStaffBusyId] = useState<string | null>(null)
  const [staffError, setStaffError] = useState('')
  const [satisfactionRatings, setSatisfactionRatings] = useState<Record<string, number>>({})
  const [satisfactionBusyId, setSatisfactionBusyId] = useState<string | null>(null)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsBusy, setRecordsBusy] = useState(false)
  const [recordsError, setRecordsError] = useState('')
  const [confirmDeleteRecords, setConfirmDeleteRecords] = useState(false)
  const [assessmentBusy, setAssessmentBusy] = useState(false)
  const [requestBusy, setRequestBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedResource, setSelectedResource] = useState<(typeof resources)[number] | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array<(number | null)>(questions.length).fill(null))
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizComplete, setQuizComplete] = useState(false)
  const [mood, setMood] = useState(7)
  const [sleep, setSleep] = useState('7')
  const [stress, setStress] = useState('3')
  const [anxiety, setAnxiety] = useState('3')
  const [vitalsSaved, setVitalsSaved] = useState(false)
  const [breathingTab, setBreathingTab] = useState<BreathingTab>('Respiración')
  const [breathingTick, setBreathingTick] = useState(0)
  const [breathingRunning, setBreathingRunning] = useState(false)
  const [breathingStarted, setBreathingStarted] = useState(false)
  const [breathingCycle, setBreathingCycle] = useState(0)
  const [selectedModality, setSelectedModality] = useState<Modality | null>(null)
  const [preparedRequest, setPreparedRequest] = useState<{ href: string; name: string } | null>(null)
  const isWellnessStaff = Boolean(
    session?.user.email_confirmed_at
      && session.user.email?.trim().toLowerCase() === WELLNESS_STAFF_EMAIL,
  )

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }

    let active = true
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setAuthError(`No se pudo comprobar tu sesión: ${error.message}`)
        setSession(data.session)
      })
      .catch((error: unknown) => {
        if (active) setAuthError(`No se pudo comprobar tu sesión: ${error instanceof Error ? error.message : String(error)}`)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      setAuthMessage('')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      setPatientRecords(emptyPatientRecords())
      setRecordsLoading(false)
      return
    }

    let active = true
    setRecordsLoading(true)
    setRecordsError('')
    void fetchPatientRecords(supabase, session.user.id)
      .then((records) => {
        if (active) setPatientRecords(records)
      })
      .catch((error: unknown) => {
        if (active) setRecordsError(`No se pudieron cargar tus registros: ${error instanceof Error ? error.message : String(error)}`)
      })
      .finally(() => {
        if (active) setRecordsLoading(false)
      })

    return () => {
      active = false
    }
  }, [session])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    const loadStats = async () => {
      try {
        const { data, error } = await client.rpc('get_public_wellness_stats')
        if (error) throw error
        const stats = data?.[0]
        if (!stats) throw new Error('La consulta no devolvió estadísticas.')
        if (!active) return
        setPublicStats({
          studentsAttended: stats.students_attended,
          satisfactionPercent: stats.satisfaction_percent,
          satisfactionResponses: stats.satisfaction_responses,
        })
        setPublicStatsError('')
      } catch (error) {
        if (active) setPublicStatsError(`No se pudieron actualizar las estadísticas. ${getPublicStatsErrorMessage(error)}`)
      }
    }
    void loadStats()
    const interval = window.setInterval(() => void loadStats(), 60_000)
    window.addEventListener('focus', loadStats)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', loadStats)
    }
  }, [])

  useEffect(() => {
    if (!supabase || !isWellnessStaff) {
      setStaffAppointments([])
      setStaffLoading(false)
      return
    }
    const client = supabase
    let active = true
    setStaffLoading(true)
    setStaffError('')
    void (async () => {
      try {
        const { data, error } = await client
          .from('appointment_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (error) throw error
        if (active) setStaffAppointments(data)
      } catch (error) {
        if (active) setStaffError(`No se pudieron cargar las solicitudes del personal: ${getErrorMessage(error)}`)
      } finally {
        if (active) setStaffLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [isWellnessStaff])

  useEffect(() => {
    if (!breathingRunning || breathingTab !== 'Respiración') return
    const interval = window.setInterval(() => setBreathingTick((tick) => tick + 1), 1000)
    return () => window.clearInterval(interval)
  }, [breathingRunning, breathingTab])

  useEffect(() => {
    if (!selectedResource) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedResource(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedResource])

  const filteredResources = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return resources.filter((resource) => {
      const matchesFilter = activeFilter === 'Todos' || resource.category === activeFilter
      const matchesSearch = !query || `${resource.title} ${resource.category} ${resource.description}`.toLocaleLowerCase('es').includes(query)
      return matchesFilter && matchesSearch
    })
  }, [activeFilter, search])

  const quizScore = answers.reduce<number>((total, answer) => total + (answer ?? 0), 0)
  const risk = quizScore <= 5
    ? { label: 'Bajo', color: '#009689', bg: '#f0fdf9', message: 'Parece que estás encontrando tu equilibrio. Sigue cuidando de ti y recuerda que siempre puedes acercarte a Bienestar Universitario.' }
    : quizScore <= 11
      ? { label: 'Moderado', color: '#c98712', bg: '#fffbeb', message: 'Puede ser un buen momento para conversar con alguien de confianza o explorar los recursos de apoyo disponibles para ti.' }
      : { label: 'Alto', color: '#dc4a4a', bg: '#fff5f5', message: 'No tienes que atravesar esto a solas. Te recomendamos contactar a Bienestar Universitario para recibir acompañamiento cercano.' }

  const breathPhase = Math.floor(breathingTick / 4) % 4
  const secondsLeft = 4 - (breathingTick % 4)
  const currentBreath = breathingContent[breathingTab]
  const phaseLabels = ['Inhala', 'Sostén', 'Exhala', 'Pausa']
  const totalPatientRecordCount = patientRecords.checkins.length
    + patientRecords.assessments.length
    + patientRecords.appointments.length
    + patientRecords.satisfaction.length

  async function refreshPatientRecords() {
    if (!supabase || !session) return
    const records = await fetchPatientRecords(supabase, session.user.id)
    setPatientRecords(records)
  }

  async function refreshPublicStats() {
    if (!supabase) return
    try {
      const { data, error } = await supabase.rpc('get_public_wellness_stats')
      if (error) throw error
      const stats = data?.[0]
      if (!stats) throw new Error('La consulta no devolvió estadísticas.')
      setPublicStats({
        studentsAttended: stats.students_attended,
        satisfactionPercent: stats.satisfaction_percent,
        satisfactionResponses: stats.satisfaction_responses,
      })
      setPublicStatsError('')
    } catch (error) {
      setPublicStatsError(`No se pudieron actualizar las estadísticas. ${getPublicStatsErrorMessage(error)}`)
    }
  }

  async function reloadStaffAppointments() {
    if (!supabase || !isWellnessStaff) return
    setStaffLoading(true)
    setStaffError('')
    try {
      const { data, error } = await supabase
        .from('appointment_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setStaffAppointments(data)
    } catch (error) {
      setStaffError(`No se pudieron cargar las solicitudes del personal: ${getErrorMessage(error)}`)
    } finally {
      setStaffLoading(false)
    }
  }

  async function handleReloadRecords() {
    setRecordsLoading(true)
    setRecordsError('')
    try {
      await refreshPatientRecords()
    } catch (error) {
      setRecordsError(`No se pudieron actualizar tus registros: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRecordsLoading(false)
    }
  }

  async function handleMarkAppointmentCompleted(appointmentId: string) {
    if (!supabase || !isWellnessStaff) return
    setStaffBusyId(appointmentId)
    setStaffError('')
    try {
      const completedAt = new Date().toISOString()
      const { error } = await supabase
        .from('appointment_requests')
        .update({ completed_at: completedAt })
        .eq('id', appointmentId)
      if (error) throw error
      setStaffAppointments((appointments) => appointments.map((appointment) => (
        appointment.id === appointmentId ? { ...appointment, completed_at: completedAt } : appointment
      )))
      await refreshPublicStats()
    } catch (error) {
      setStaffError(`No se pudo marcar la atención como completada: ${getErrorMessage(error)}`)
    } finally {
      setStaffBusyId(null)
    }
  }

  async function handleSatisfactionSubmit(appointmentId: string) {
    if (!supabase || !session) return
    const rating = satisfactionRatings[appointmentId]
    if (!rating) return
    setSatisfactionBusyId(appointmentId)
    setRecordsError('')
    let ratingSaved = false
    try {
      const { error } = await supabase.from('appointment_satisfaction').insert({
        appointment_id: appointmentId,
        user_id: session.user.id,
        rating,
      })
      if (error) throw error
      ratingSaved = true
      await refreshPatientRecords()
      await refreshPublicStats()
    } catch (error) {
      const detail = getErrorMessage(error)
      setRecordsError(ratingSaved ? `Tu opinión se guardó, pero no se pudo actualizar el historial: ${detail}` : `No se pudo guardar tu opinión: ${detail}`)
    } finally {
      setSatisfactionBusyId(null)
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setAuthBusy(true)
    setAuthError('')
    setAuthMessage('')
    try {
      const result = authMode === 'signup'
        ? await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })
        : await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })

      if (result.error) {
        setAuthError(`No se pudo ${authMode === 'signup' ? 'crear la cuenta' : 'iniciar sesión'}: ${result.error.message}`)
        return
      }
      if (authMode === 'signup' && !result.data.session) {
        setAuthMessage('Cuenta creada. Revisa tu correo para confirmar la dirección y luego inicia sesión.')
        setAuthMode('signin')
        return
      }
      setAuthMessage('Sesión iniciada. Tus registros están asociados a esta cuenta.')
      setAuthPassword('')
    } catch (error) {
      setAuthError(`No se pudo completar la autenticación: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) return
    setAuthError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) setAuthError(`No se pudo cerrar la sesión: ${error.message}`)
    } catch (error) {
      setAuthError(`No se pudo cerrar la sesión: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async function handleDeleteRecords() {
    if (!supabase || !session) return
    setRecordsBusy(true)
    setRecordsError('')
    try {
      await deletePatientRecords(supabase, session.user.id)
      setPatientRecords(emptyPatientRecords())
      setConfirmDeleteRecords(false)
    } catch (error) {
      setRecordsError(`No se pudieron borrar todos los registros. Verifica la conexión e inténtalo de nuevo. ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRecordsBusy(false)
    }
  }

  function exportPatientRecords() {
    const exportData = {
      exported_at: new Date().toISOString(),
      account_email: session?.user.email,
      records: patientRecords,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ataraxia-registros-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function selectAnswer(score: number) {
    setAnswers((current) => current.map((answer, index) => index === currentQuestion ? score : answer))
  }

  async function nextQuestion() {
    if (answers[currentQuestion] === null) return
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((question) => question + 1)
      return
    }
    if (!supabase || !session) return

    setAssessmentBusy(true)
    setRecordsError('')
    let recordSaved = false
    try {
      const { error } = await supabase.from('wellness_assessments').insert({
        user_id: session.user.id,
        answers: answers.map((answer) => answer ?? 0),
        score: quizScore,
        risk_level: risk.label,
      })
      if (error) {
        setRecordsError(`No se pudo guardar la evaluación: ${error.message}`)
        return
      }
      recordSaved = true
      await refreshPatientRecords()
      setQuizComplete(true)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setRecordsError(recordSaved ? `La evaluación se guardó, pero no se pudo actualizar el historial: ${detail}` : `No se pudo guardar la evaluación: ${detail}`)
    } finally {
      setAssessmentBusy(false)
    }
  }

  async function handleVitalsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !session) return

    setRecordsBusy(true)
    setRecordsError('')
    let recordSaved = false
    try {
      const { error } = await supabase.from('wellness_checkins').insert({
        user_id: session.user.id,
        mood,
        sleep_hours: sleep,
        stress_level: Number(stress),
        anxiety_level: Number(anxiety),
      })
      if (error) {
        setRecordsError(`No se pudo guardar el registro: ${error.message}`)
        return
      }
      recordSaved = true
      await refreshPatientRecords()
      setVitalsSaved(true)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setRecordsError(recordSaved ? `El registro se guardó, pero no se pudo actualizar el historial: ${detail}` : `No se pudo guardar el registro: ${detail}`)
    } finally {
      setRecordsBusy(false)
    }
  }

  function restartBreathing() {
    setBreathingTick(0)
    setBreathingCycle((cycle) => cycle + 1)
    setBreathingStarted(true)
    setBreathingRunning(true)
  }

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedModality || !supabase || !session) return

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name')).trim()
    const email = String(formData.get('email')).trim()
    const availability = String(formData.get('availability')).trim()
    const message = String(formData.get('message')).trim()
    setRequestBusy(true)
    setRecordsError('')
    let requestSaved = false
    try {
      const { error } = await supabase.from('appointment_requests').insert({
        user_id: session.user.id,
        name,
        email,
        availability,
        message,
        modality: selectedModality,
      })
      if (error) {
        setRecordsError(`No se pudo guardar la solicitud: ${error.message}`)
        return
      }
      requestSaved = true
      const body = [
        `Hola, quisiera solicitar acompañamiento de ${modalityLabels[selectedModality].toLowerCase()}.`,
        '',
        `Nombre: ${name}`,
        `Correo universitario: ${email}`,
        `Disponibilidad: ${availability}`,
        `Mensaje: ${message || 'Sin mensaje adicional.'}`,
      ].join('\n')

      setPreparedRequest({
        name,
        href: `mailto:Kathia.aguilar@ulv.edu.mx?subject=${encodeURIComponent(`Solicitud de ${modalityLabels[selectedModality]}`)}&body=${encodeURIComponent(body)}`,
      })
      await refreshPatientRecords()
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setRecordsError(requestSaved ? `La solicitud se guardó, pero no se pudo actualizar el historial: ${detail}` : `No se pudo guardar la solicitud: ${detail}`)
    } finally {
      setRequestBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#101828]">
      <header className="fixed inset-x-0 top-0 z-50">
        <nav className="border-b border-[#cbfbf1] bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
            <Logo />
            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#4a5565] transition-colors hover:bg-[#f0fdfc] hover:text-[#00786f]">{link.label}</a>
              ))}
            </div>
            <a href="#evaluación" className="hidden rounded-full bg-[#009689] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#00786f] lg:inline-flex">Iniciar Evaluación</a>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#00786f] hover:bg-[#f0fdfc] lg:hidden"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={23} />
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="border-t border-[#cbfbf1] bg-white px-5 py-3 shadow-lg lg:hidden">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-[#4a5565] hover:bg-[#f0fdfc] hover:text-[#00786f]">{link.label}</a>
              ))}
              <a href="#evaluación" onClick={() => setMobileMenuOpen(false)} className="mt-2 flex justify-center rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white">Iniciar Evaluación</a>
            </div>
          )}
        </nav>
      </header>

      <main>
        <section
          id="inicio"
          className="relative flex min-h-[907px] items-center justify-center overflow-hidden bg-cover bg-center px-5 pb-16 pt-[160px] text-center"
          style={{
            backgroundImage: "linear-gradient(141deg,rgba(11,79,74,.84),rgba(0,95,90,.76),rgba(0,79,59,.83)),url('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2200&q=85')",
          }}
        >
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-md sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#00d492] shadow-[0_0_12px_#00d492]" />
              Plataforma de Salud Mental Universitaria
            </span>
            <h1 className="text-[clamp(3.5rem,9vw,68px)] font-extrabold leading-none tracking-[-1.4px] text-white">ATARAXIA</h1>
            <p className="mt-5 text-xl font-light italic text-white/85 sm:text-2xl">Encuentra tu equilibrio interior</p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Un espacio seguro, pensado para acompañarte. Encuentra recursos, orientación y apoyo profesional para cuidar tu bienestar durante cada etapa de la vida universitaria.
            </p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <a href="#evaluación" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00bba7] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#009689]">
                Comenzar evaluación <Icon name="arrow" size={17} />
              </a>
              <a href="#nosotros" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15">
                Conoce ATARAXIA
              </a>
            </div>
            <div className="mt-12 grid w-full max-w-[700px] grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: publicStats.studentsAttended === null ? '—' : String(publicStats.studentsAttended), label: 'Estudiantes atendidos' },
                { value: publicStats.satisfactionPercent === null ? '—' : `${publicStats.satisfactionPercent}%`, label: 'Satisfacción' },
                { value: '24/7', label: 'Disponible' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/75">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 max-w-[700px] text-xs text-white/70" aria-live="polite">
              {publicStatsError || (publicStats.satisfactionResponses < 5
                ? 'La satisfacción se mostrará al reunir 5 respuestas.'
                : 'Estadísticas actualizadas con atenciones completadas y opiniones recibidas.')}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/10 to-transparent" />
        </section>

        <section id="nosotros" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-[1160px] items-center gap-14 lg:grid-cols-[1.03fr_.97fr]">
            <div>
              <SectionEyebrow><Icon name="heart" size={15} /> Nuestro enfoque</SectionEyebrow>
              <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-[#101828] sm:text-[42px]">Tu bienestar es nuestro enfoque <span className="text-[#009689]">biopsicosocial</span> único</h2>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#6a7282]">
                Creemos que cada parte de ti importa. Por eso acompañamos tu bienestar desde una mirada integral, sensible a tu historia, a tu entorno y a los retos de la vida universitaria.
              </p>
              <ul className="mt-7 space-y-3.5">
                {[
                  'Un espacio confidencial donde puedes ser tú.',
                  'Acompañamiento humano, respetuoso y sin juicios.',
                  'Atención conectada con tus necesidades y tiempos.',
                  'Herramientas para construir bienestar a largo plazo.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#4a5565]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6fbf6] text-[#009689]"><Icon name="check" size={14} /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                {disciplines.map((discipline) => (
                  <div key={discipline.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md shadow-slate-900/[.03] transition hover:-translate-y-1 hover:shadow-lg">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6fbf6] text-[#009689]"><Icon name={discipline.icon} size={21} /></span>
                    <h3 className="text-sm font-bold text-[#101828]">{discipline.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-[#6a7282]">{discipline.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[490px] lg:ml-auto">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
                alt="Estudiantes compartiendo un momento agradable en el campus"
                className="h-[440px] w-full rounded-[28px] object-cover shadow-xl sm:h-[560px]"
                loading="lazy"
              />
              <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-[#cbfbf1] bg-white p-5 shadow-xl sm:-left-10 sm:right-10 sm:p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6fbf6] text-[#009689]"><Icon name="heart" size={23} /></span>
                  <div>
                    <p className="text-xl font-bold text-[#101828]">No estás a solas</p>
                    <p className="mt-1 text-xs leading-5 text-[#6a7282]">Hay personas y herramientas listas para acompañarte en tu camino.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="scroll-mt-20 bg-[#f7fbfa] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1160px]">
            <div className="text-center">
              <SectionEyebrow><Icon name="sparkles" size={15} /> Un espacio para ti</SectionEyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-[#101828] sm:text-4xl">Recursos para tu <span className="text-[#009689]">bienestar</span></h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6a7282]">Ideas, herramientas y lecturas para acompañarte en lo que estás viviendo, a tu propio ritmo.</p>
            </div>
            <div className="mx-auto mt-9 max-w-2xl">
              <label className="flex items-center gap-3 rounded-2xl border border-[#e5eeec] bg-white px-4 py-3.5 shadow-sm focus-within:border-[#00bba7] focus-within:ring-4 focus-within:ring-[#00bba7]/10">
                <Icon name="search" size={19} className="text-[#8a95a3]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar recursos..." className="w-full bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#9aa3af]" aria-label="Buscar recursos" />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['Todos', ...symptoms].map((symptom) => (
                <button key={symptom} type="button" onClick={() => setActiveFilter(symptom)} className={`rounded-full px-4 py-2 text-xs font-medium transition ${activeFilter === symptom ? 'bg-[#009689] text-white shadow-sm' : 'border border-[#e5eeec] bg-white text-[#4a5565] hover:border-[#00bba7] hover:text-[#00786f]'}`}>
                  {symptom}
                </button>
              ))}
            </div>
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredResources.map((resource) => (
                <article key={resource.title} className="group flex min-h-[265px] flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-md shadow-slate-900/[.03] transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6fbf6] text-[#009689]"><Icon name={resource.icon} size={20} /></span>
                    <span className="rounded-full bg-[#f0fdfc] px-2.5 py-1 text-[10px] font-semibold text-[#00786f]">{resource.category}</span>
                  </div>
                  <h3 className="mt-5 text-[15px] font-bold leading-snug text-[#101828]">{resource.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-[#6a7282]">{resource.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8a95a3]"><Icon name="clock" size={13} /> {resource.time} de lectura</span>
                    <button type="button" onClick={() => setSelectedResource(resource)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#009689] transition group-hover:text-[#00786f]">
                      {resource.category === 'Crisis' ? 'Ver pasos de apoyo' : 'Ver Recurso'} <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {filteredResources.length === 0 && (
              <div className="py-14 text-center">
                <p className="font-semibold text-[#101828]">No encontramos recursos con esa búsqueda.</p>
                <button type="button" onClick={() => { setSearch(''); setActiveFilter('Todos') }} className="mt-2 text-sm font-medium text-[#009689] hover:underline">Limpiar filtros</button>
              </div>
            )}
          </div>
        </section>

        <section id="cuenta" className="scroll-mt-20 px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-[1080px] rounded-3xl border border-[#cbfbf1] bg-[linear-gradient(135deg,#f0fdfc,#fff)] p-6 shadow-md shadow-slate-900/[.03] sm:p-9">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <SectionEyebrow><Icon name="lock" size={15} /> Tu espacio privado</SectionEyebrow>
                <h2 className="text-2xl font-bold text-[#101828] sm:text-3xl">Tus registros, bajo tu cuenta</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a7282]">Tus evaluaciones y signos vitales solo son visibles para ti; las solicitudes de atención pueden consultarlas únicamente tú y el personal institucional autorizado. No se guardan datos de pacientes en GitHub.</p>
              </div>
              {session && (
                <button type="button" onClick={() => void handleSignOut()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#4a5565] hover:bg-gray-50">
                  <Icon name="logout" size={16} /> Cerrar sesión
                </button>
              )}
            </div>

            {!supabaseConfigured ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Supabase todavía no está configurado. Crea un proyecto, ejecuta la migración privada y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` siguiendo el README.
              </div>
            ) : authLoading ? (
              <p className="mt-6 text-sm text-[#6a7282]">Comprobando tu sesión…</p>
            ) : session ? (
              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#005f5a]"><Icon name="user" size={17} /> Sesión activa: {session.user.email}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Registros de ánimo', count: patientRecords.checkins.length },
                    { label: 'Evaluaciones', count: patientRecords.assessments.length },
                    { label: 'Solicitudes de atención', count: patientRecords.appointments.length },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[#e5eeec] bg-white p-4">
                      <p className="text-2xl font-bold text-[#009689]">{recordsLoading ? '…' : item.count}</p>
                      <p className="mt-1 text-xs text-[#6a7282]">{item.label}</p>
                    </div>
                  ))}
                </div>

                {recordsLoading ? (
                  <p className="mt-5 text-sm text-[#6a7282]">Cargando tus registros…</p>
                ) : totalPatientRecordCount === 0 ? (
                  <p className="mt-5 rounded-xl bg-white p-4 text-sm text-[#6a7282]">Todavía no hay registros. Al guardar tu primera evaluación, registro de ánimo o solicitud, aparecerá aquí.</p>
                ) : (
                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#e5eeec] bg-white p-4">
                      <h3 className="text-sm font-bold text-[#101828]">Ánimo reciente</h3>
                      <ul className="mt-3 space-y-2.5">
                        {patientRecords.checkins.slice(0, 5).map((record) => (
                          <li key={record.id} className="border-t border-gray-100 pt-2.5 text-xs text-[#4a5565]">
                            <span className="font-semibold text-[#00786f]">Ánimo {record.mood}/10</span> · Sueño {record.sleep_hours} h<br />
                            Estrés {record.stress_level}/5 · Ansiedad {record.anxiety_level}/5<br />
                            <span className="text-[#8a95a3]">{new Date(record.created_at).toLocaleString('es')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-[#e5eeec] bg-white p-4">
                      <h3 className="text-sm font-bold text-[#101828]">Evaluaciones recientes</h3>
                      <ul className="mt-3 space-y-2.5">
                        {patientRecords.assessments.slice(0, 5).map((record) => (
                          <li key={record.id} className="border-t border-gray-100 pt-2.5 text-xs text-[#4a5565]">
                            <span className="font-semibold text-[#00786f]">Nivel {record.risk_level.toLowerCase()} · {record.score}/18</span><br />
                            {Array.isArray(record.answers) ? record.answers.length : 0} respuestas guardadas<br />
                            <span className="text-[#8a95a3]">{new Date(record.created_at).toLocaleString('es')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-[#e5eeec] bg-white p-4">
                      <h3 className="text-sm font-bold text-[#101828]">Solicitudes recientes</h3>
                      <ul className="mt-3 space-y-2.5">
                        {patientRecords.appointments.slice(0, 5).map((record) => (
                          <li key={record.id} className="border-t border-gray-100 pt-2.5 text-xs text-[#4a5565]">
                            <span className="font-semibold text-[#00786f]">{record.modality === 'virtual' ? 'Atención virtual' : 'Atención presencial'}</span> · {record.name}<br />
                            {record.email}<br />
                            <span className="text-[#8a95a3]">{new Date(record.created_at).toLocaleString('es')}</span>
                            {record.completed_at ? (
                              <div className="mt-2 rounded-xl bg-[#f0fdfc] p-3">
                                {(() => {
                                  const feedback = patientRecords.satisfaction.find((entry) => entry.appointment_id === record.id)
                                  if (feedback) return <p className="font-semibold text-[#00786f]">Opinión registrada: {feedback.rating}/5</p>
                                  return (
                                    <>
                                      <p className="font-medium text-[#005f5a]">Atención completada. ¿Cómo fue tu experiencia?</p>
                                      <div className="mt-2 flex items-center gap-1.5" role="group" aria-label={`Califica la atención del ${new Date(record.completed_at).toLocaleDateString('es')}`}>
                                        {Array.from({ length: 5 }, (_, index) => index + 1).map((rating) => {
                                          const selected = satisfactionRatings[record.id] === rating
                                          return (
                                            <button
                                              key={rating}
                                              type="button"
                                              aria-label={`${rating} de 5`}
                                              aria-pressed={selected}
                                              onClick={() => setSatisfactionRatings((current) => ({ ...current, [record.id]: rating }))}
                                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${selected ? 'bg-[#009689] text-white' : 'border border-[#cbfbf1] bg-white text-[#00786f] hover:bg-[#e6fbf6]'}`}
                                            >{rating}</button>
                                          )
                                        })}
                                        <button
                                          type="button"
                                          onClick={() => void handleSatisfactionSubmit(record.id)}
                                          disabled={satisfactionBusyId === record.id || !satisfactionRatings[record.id]}
                                          className="ml-1 rounded-full bg-[#009689] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#00786f] disabled:opacity-50"
                                        >{satisfactionBusyId === record.id ? 'Guardando…' : 'Enviar'}</button>
                                      </div>
                                      <p className="mt-1 text-[10px] text-[#8a95a3]">1 = Muy mala · 5 = Muy buena</p>
                                    </>
                                  )
                                })()}
                              </div>
                            ) : <p className="mt-2 text-[11px] text-[#8a95a3]">Pendiente de atención.</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={exportPatientRecords} disabled={totalPatientRecordCount === 0} className="inline-flex items-center gap-2 rounded-full bg-[#009689] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00786f] disabled:cursor-not-allowed disabled:opacity-50"><Icon name="download" size={16} /> Descargar mis datos (JSON)</button>
                  <button type="button" onClick={() => void handleReloadRecords()} disabled={recordsLoading || recordsBusy} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#4a5565] hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50">Actualizar historial</button>
                  {!confirmDeleteRecords ? (
                    <button type="button" onClick={() => setConfirmDeleteRecords(true)} disabled={totalPatientRecordCount === 0} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="trash" size={16} /> Borrar mis datos</button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirmar eliminación de registros">
                      <span className="text-sm font-medium text-red-800">¿Borrar permanentemente todos tus registros?</span>
                      <button type="button" onClick={() => void handleDeleteRecords()} disabled={recordsBusy} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{recordsBusy ? 'Borrando…' : 'Sí, borrar'}</button>
                      <button type="button" onClick={() => setConfirmDeleteRecords(false)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#4a5565]">Cancelar</button>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs leading-5 text-[#6a7282]">La información se guarda en una base de datos privada con políticas de acceso por cuenta. Antes de usar datos clínicos reales, verifica los requisitos legales y de seguridad aplicables.</p>
                {isWellnessStaff && (
                  <section className="mt-7 rounded-2xl border border-[#cbfbf1] bg-white p-5" aria-labelledby="staff-appointments-title">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 id="staff-appointments-title" className="text-base font-bold text-[#101828]">Gestión de atenciones</h3>
                        <p className="mt-1 text-xs text-[#6a7282]">Marca como completadas solo las citas que ya se realizaron.</p>
                      </div>
                      <button type="button" onClick={() => void reloadStaffAppointments()} disabled={staffLoading} className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-[#4a5565] hover:bg-gray-50 disabled:opacity-50">{staffLoading ? 'Actualizando…' : 'Actualizar solicitudes'}</button>
                    </div>
                    {staffError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{staffError}</p>}
                    {staffLoading ? <p className="mt-4 text-sm text-[#6a7282]">Cargando solicitudes…</p> : staffAppointments.length === 0 ? (
                      <p className="mt-4 text-sm text-[#6a7282]">No hay solicitudes registradas.</p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {staffAppointments.map((appointment) => (
                          <li key={appointment.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                              <div className="min-w-0">
                                <p className="font-semibold text-[#101828]">{appointment.name} · {appointment.modality === 'virtual' ? 'Virtual' : 'Presencial'}</p>
                                <p className="mt-1 break-all text-xs text-[#4a5565]">{appointment.email}</p>
                                <p className="mt-1 text-xs text-[#6a7282]">Disponibilidad: {appointment.availability}</p>
                                {appointment.message && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#4a5565]">{appointment.message}</p>}
                                <p className="mt-2 text-[11px] text-[#8a95a3]">Solicitud: {new Date(appointment.created_at).toLocaleString('es')}</p>
                              </div>
                              {appointment.completed_at ? (
                                <span className="shrink-0 rounded-full bg-[#e6fbf6] px-3 py-1.5 text-xs font-semibold text-[#00786f]">Atendida · {new Date(appointment.completed_at).toLocaleDateString('es')}</span>
                              ) : (
                                <button type="button" onClick={() => void handleMarkAppointmentCompleted(appointment.id)} disabled={staffBusyId === appointment.id} className="shrink-0 rounded-full bg-[#009689] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00786f] disabled:opacity-50">{staffBusyId === appointment.id ? 'Guardando…' : 'Marcar como atendida'}</button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-4 text-[11px] leading-5 text-[#8a95a3]">Esta vista contiene datos personales de solicitudes y solo está autorizada para la cuenta institucional verificada.</p>
                  </section>
                )}
              </div>
            ) : (
              <div className="mt-6 grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
                <div className="text-sm leading-6 text-[#4a5565]">
                  <p>Inicia sesión o crea una cuenta para guardar y consultar tu información desde tus dispositivos.</p>
                  <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#6a7282]"><Icon name="lock" size={15} className="mt-0.5 shrink-0 text-[#009689]" />Tus registros están sujetos a políticas de acceso por cuenta. No compartas tu contraseña.</p>
                </div>
                <form onSubmit={handleAuthSubmit} className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-[#4a5565]">Correo electrónico
                    <input required type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10" />
                  </label>
                  <label className="text-xs font-semibold text-[#4a5565]">Contraseña
                    <input required type="password" minLength={8} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10" />
                  </label>
                  {authMode === 'signup' && (
                    <label className="flex items-start gap-2.5 text-xs leading-5 text-[#4a5565] sm:col-span-2">
                      <input required type="checkbox" className="mt-1 accent-[#009689]" />
                      Acepto crear una cuenta y guardar mis evaluaciones y registros de bienestar en la base de datos de ATARAXIA, asociados a mi usuario.
                    </label>
                  )}
                  <button type="submit" disabled={authBusy} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f] disabled:opacity-50 sm:col-span-2">
                    {authBusy ? 'Un momento…' : authMode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'} <Icon name="arrow" size={16} />
                  </button>
                  <button type="button" onClick={() => { setAuthMode((mode) => mode === 'signin' ? 'signup' : 'signin'); setAuthError(''); setAuthMessage('') }} className="text-xs font-semibold text-[#00786f] hover:underline sm:col-span-2">
                    {authMode === 'signin' ? '¿No tienes cuenta? Crear cuenta' : '¿Ya tienes cuenta? Iniciar sesión'}
                  </button>
                </form>
              </div>
            )}

            {authError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{authError}</p>}
            {authMessage && <p role="status" className="mt-4 rounded-xl border border-[#cbfbf1] bg-white p-3 text-sm text-[#005f5a]">{authMessage}</p>}
            {recordsError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{recordsError}</p>}
          </div>
        </section>

        <section id="evaluación" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-[1080px] items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <SectionEyebrow><Icon name="brain" size={15} /> Conócete un poco más</SectionEyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-[#101828] sm:text-[40px]">Un primer paso hacia tu <span className="text-[#009689]">bienestar</span></h2>
              <p className="mt-5 text-sm leading-7 text-[#6a7282]">Responde estas preguntas breves sobre cómo te has sentido durante las últimas dos semanas. Al terminar, tus respuestas y el resultado se guardarán en tu cuenta para que puedas consultar tu historial.</p>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#cbfbf1] bg-[#f0fdfc] p-4">
                <Icon name="shield" size={20} className="mt-0.5 shrink-0 text-[#009689]" />
                <p className="text-xs leading-5 text-[#4a5565]">Esta autoevaluación es orientativa y no reemplaza un diagnóstico profesional. Tus respuestas se asocian a tu cuenta. Si necesitas apoyo, estamos aquí para escucharte.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-slate-900/[.05] sm:p-8">
              {!supabaseConfigured || authLoading || !session ? (
                <div className="py-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6fbf6] text-[#009689]"><Icon name="lock" size={22} /></span>
                  <h3 className="mt-4 text-lg font-bold text-[#101828]">{!supabaseConfigured ? 'Configura el almacenamiento privado' : 'Inicia sesión para guardar tu evaluación'}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6a7282]">Para proteger tus respuestas y consultar tu historial, necesitas una cuenta vinculada a una base de datos privada.</p>
                  <a href="#cuenta" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f]">Ir a Mi cuenta <Icon name="arrow" size={16} /></a>
                </div>
              ) : !quizComplete ? (
                <>
                  {recordsError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{recordsError}</p>}
                  <div className="flex items-center justify-between text-xs font-medium text-[#6a7282]">
                    <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eaf1ef]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#009689] to-[#00d492] transition-all duration-500" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
                  </div>
                  <h3 className="mt-7 min-h-[56px] text-lg font-bold leading-7 text-[#101828]">{questions[currentQuestion]}</h3>
                  <div className="mt-5 space-y-2.5">
                    {answerOptions.map((option, index) => {
                      const selected = answers[currentQuestion] === option.score
                      return (
                        <button key={option.label} type="button" onClick={() => selectAnswer(option.score)} className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition ${selected ? 'border-[#009689] bg-[#f0fdfc] text-[#005f5a]' : 'border-gray-100 text-[#4a5565] hover:border-[#cbfbf1] hover:bg-[#f9fdfc]'}`}>
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? 'bg-[#009689] text-white' : 'bg-[#f1f5f4] text-[#6a7282]'}`}>{String.fromCharCode(65 + index)}</span>
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <button type="button" onClick={() => setCurrentQuestion((question) => Math.max(0, question - 1))} disabled={currentQuestion === 0} className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#6a7282] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                    <button type="button" onClick={() => void nextQuestion()} disabled={answers[currentQuestion] === null || assessmentBusy} className="inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00786f] disabled:cursor-not-allowed disabled:opacity-45">
                      {assessmentBusy ? 'Guardando…' : currentQuestion === questions.length - 1 ? 'Guardar y ver resultado' : 'Siguiente'} <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-3 text-center" aria-live="polite">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: risk.bg, color: risk.color }}><Icon name="heart" size={26} /></span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-[#8a95a3]">Tu resultado orientativo</p>
                  <h3 className="mt-2 text-3xl font-bold" style={{ color: risk.color }}>Nivel {risk.label.toLowerCase()}</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6a7282]">{risk.message}</p>
                  <a href="#atención" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f]">Conoce tus opciones de atención <Icon name="arrow" size={16} /></a>
                  <div><button type="button" onClick={() => { setAnswers(Array(questions.length).fill(null)); setCurrentQuestion(0); setQuizComplete(false) }} className="mt-4 text-xs font-medium text-[#6a7282] hover:text-[#00786f]">Volver a realizar la evaluación</button></div>
                  <p className="mt-5 text-[11px] text-[#9aa3af]">Si estás en una situación urgente, llama a la línea de crisis estudiantil 115.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="signos" className="scroll-mt-20 bg-[#f7fbfa] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-[1080px] items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <SectionEyebrow><Icon name="heart" size={15} /> Un momento para ti</SectionEyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-[#101828] sm:text-[40px]">¿Cómo te sientes <span className="text-[#009689]">hoy?</span></h2>
              <p className="mt-5 text-sm leading-7 text-[#6a7282]">Hacer una pausa para escucharte también es cuidarte. Tus registros se asocian a tu cuenta privada para que puedas consultarlos después.</p>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#cbfbf1] bg-white p-4">
                <Icon name="shield" size={19} className="mt-0.5 shrink-0 text-[#009689]" />
                <p className="text-xs leading-5 text-[#6a7282]">Los datos se envían a Supabase y se guardan bajo las reglas de acceso de tu cuenta. No incluyas información que no quieras registrar.</p>
              </div>
            </div>
            {session ? <form onSubmit={(event) => void handleVitalsSubmit(event)} onChange={() => setVitalsSaved(false)} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-slate-900/[.04] sm:p-8">
              <label className="block">
                <span className="flex justify-between text-sm font-semibold text-[#101828]"><span>¿Cómo está tu ánimo?</span><span className="font-bold text-[#009689]">{mood} / 10</span></span>
                <input aria-label="Ánimo de 1 a 10" type="range" min="1" max="10" value={mood} onChange={(event) => setMood(Number(event.target.value))} className="mt-4 w-full accent-[#009689]" />
                <span className="mt-1 flex justify-between text-[11px] text-[#9aa3af]"><span>Necesito una pausa</span><span>Me siento muy bien</span></span>
              </label>
              <div className="mt-7 grid gap-5 sm:grid-cols-3">
                <label className="text-sm font-semibold text-[#101828]">Horas de sueño
                  <span className="relative mt-2 block">
                    <select value={sleep} onChange={(event) => setSleep(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-normal text-[#4a5565] outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10">
                      {['Menos de 4', '4', '5', '6', '7', '8', '9+'].map((hours) => <option key={hours} value={hours}>{hours === 'Menos de 4' ? hours : `${hours} horas`}</option>)}
                    </select>
                  </span>
                </label>
                <label className="text-sm font-semibold text-[#101828]">Nivel de estrés
                  <select value={stress} onChange={(event) => setStress(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-normal text-[#4a5565] outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10">
                    {['1', '2', '3', '4', '5'].map((level) => <option key={level} value={level}>{level} / 5</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-[#101828]">Nivel de ansiedad
                  <select value={anxiety} onChange={(event) => setAnxiety(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-normal text-[#4a5565] outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10">
                    {['1', '2', '3', '4', '5'].map((level) => <option key={level} value={level}>{level} / 5</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button type="submit" disabled={recordsBusy} className="inline-flex items-center gap-2 rounded-full bg-[#009689] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00786f] disabled:cursor-wait disabled:opacity-50">{recordsBusy ? 'Guardando…' : 'Guardar mi registro'} <Icon name="arrow" size={16} /></button>
                {vitalsSaved && <p role="status" className="flex items-center gap-2 rounded-full bg-[#f0fdfc] px-4 py-2 text-sm font-semibold text-[#00786f]"><Icon name="check" size={17} /> Registro Guardado ✓</p>}
              </div>
              {recordsError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{recordsError}</p>}
            </form> : (
              <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-slate-900/[.04]">
                <Icon name="lock" size={25} className="mx-auto text-[#009689]" />
                <p className="mt-3 text-sm font-semibold text-[#101828]">Inicia sesión para guardar tus signos vitales</p>
                <a href="#cuenta" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f]">Ir a Mi cuenta <Icon name="arrow" size={16} /></a>
              </div>
            )}
          </div>
        </section>

        <section id="técnicas" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1080px]">
            <div className="text-center">
              <SectionEyebrow><Icon name="wind" size={15} /> Pausas que te hacen bien</SectionEyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-[#101828] sm:text-4xl">Encuentra tu momento de <span className="text-[#009689]">calma</span></h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6a7282]">Prueba una práctica sencilla y descubre qué te ayuda a reconectar contigo.</p>
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-2">
              {breathingTabs.map((tab) => (
                <button key={tab.label} type="button" onClick={() => { setBreathingTab(tab.label); if (tab.label !== 'Respiración') setBreathingRunning(false) }} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold transition sm:text-sm ${breathingTab === tab.label ? 'bg-[#009689] text-white shadow-md shadow-[#009689]/15' : 'border border-gray-200 bg-white text-[#6a7282] hover:border-[#cbfbf1] hover:text-[#00786f]'}`}>
                  <Icon name={tab.icon} size={17} /> {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-8 grid overflow-hidden rounded-[28px] border border-[#cbfbf1] bg-[#f7fbfa] lg:grid-cols-2">
              <div className="flex flex-col justify-center p-7 sm:p-11">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6fbf6] text-[#009689]"><Icon name={breathingTabs.find((tab) => tab.label === breathingTab)!.icon} size={23} /></span>
                <h3 className="mt-5 text-2xl font-bold text-[#101828]">{currentBreath.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6a7282]">{currentBreath.description}</p>
                <ol className="mt-7 space-y-3">
                  {currentBreath.steps.map((step, index) => (
                    <li key={step} className={`flex items-center gap-3 text-sm ${breathingTab === 'Respiración' && breathPhase === index ? 'font-semibold text-[#00786f]' : 'text-[#6a7282]'}`}>
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${breathingTab === 'Respiración' && breathPhase === index ? 'bg-[#009689] text-white' : 'bg-white text-[#8a95a3]'}`}>{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex min-h-[330px] flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#d7f8ef_0%,#e9f9f4_45%,#f2faf7_100%)] p-8 sm:min-h-[410px]">
                <div className="relative flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
                  <span className="absolute h-full w-full rounded-full border border-[#009689]/10" />
                  <span className="absolute h-[82%] w-[82%] rounded-full border border-[#009689]/15" />
                  <span key={breathingCycle} className="breathing-orb absolute h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#9bf1d8,#40cbb1_60%,#009689)] shadow-[0_18px_55px_rgba(0,150,137,.24)]" style={{ animationPlayState: breathingRunning && breathingTab === 'Respiración' ? 'running' : 'paused' }} />
                  <div className="relative z-10 text-center text-white">
                    <p className="text-xs font-semibold uppercase tracking-[.2em]">{breathingTab === 'Respiración' ? phaseLabels[breathPhase] : 'Tu momento'}</p>
                    <p className="mt-1 text-4xl font-light">{breathingTab === 'Respiración' ? secondsLeft : '♡'}</p>
                  </div>
                </div>
                <div className="mt-7 flex items-center gap-2.5" aria-label={breathingTab === 'Respiración' ? `Fase ${phaseLabels[breathPhase]}` : 'Práctica guiada'}>
                  {phaseLabels.map((phase, index) => <span key={phase} className={`h-2 rounded-full transition-all duration-300 ${breathingTab === 'Respiración' && breathPhase === index ? 'w-7 bg-[#009689]' : 'w-2 bg-[#009689]/25'}`} />)}
                </div>
                <p className="mt-3 text-xs text-[#6a7282]">{breathingTab === 'Respiración' ? `${phaseLabels[breathPhase]} · ${secondsLeft} s` : 'A tu ritmo, sin expectativas'}</p>
                {breathingTab === 'Respiración' && (
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={() => { setBreathingStarted(true); setBreathingRunning((running) => !running) }} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-full bg-[#009689] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00786f]" aria-label={breathingRunning ? 'Pausar respiración' : breathingStarted ? 'Continuar respiración' : 'Iniciar respiración'}>
                      <Icon name={breathingRunning ? 'pause' : 'play'} size={16} />
                      {breathingRunning ? 'Pausar' : breathingStarted ? 'Continuar' : 'Iniciar'}
                    </button>
                    <button type="button" onClick={restartBreathing} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cbfbf1] bg-white px-5 py-2.5 text-sm font-semibold text-[#00786f] transition hover:bg-[#f0fdfc]" aria-label="Empezar respiración de nuevo">
                      <Icon name="restart" size={16} /> Empezar de nuevo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="atención" className="scroll-mt-20 bg-[#f7fbfa] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1080px]">
            <div className="text-center">
              <SectionEyebrow><Icon name="heart" size={15} /> Estamos contigo</SectionEyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-[#101828] sm:text-4xl">Acompañamiento a tu <span className="text-[#009689]">manera</span></h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6a7282]">Da el primer paso de la forma que mejor se ajuste a ti. Tu bienestar puede comenzar aquí.</p>
            </div>
            <div className="mt-9 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: 'Atención Virtual', icon: 'video' as const,
                  image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=85',
                  description: 'Un espacio seguro y confidencial, donde estés. Conéctate con profesionales que te escuchan.',
                  features: ['Sesiones desde donde te sientas cómodo/a', 'Horarios flexibles para tu rutina', 'Acompañamiento profesional confidencial'],
                  action: 'Solicitar atención virtual',
                },
                {
                  title: 'Atención Presencial', icon: 'building' as const,
                  image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
                  description: 'Encuentra un lugar tranquilo en el campus para conversar y sentirte acompañado/a.',
                  features: ['Espacio cálido en Bienestar Universitario', 'Atención cercana y personalizada', 'Acompañamiento interdisciplinario'],
                  action: 'Conocer el espacio',
                },
              ].map((modality) => (
                <article key={modality.title} className="relative min-h-[390px] overflow-hidden rounded-[26px] bg-cover bg-center p-7 text-white sm:min-h-[420px] sm:p-9" style={{ backgroundImage: `linear-gradient(130deg,rgba(0,79,73,.91),rgba(0,120,111,.77)),url('${modality.image}')` }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15"><Icon name={modality.icon} size={24} /></span>
                  <h3 className="mt-6 text-2xl font-bold">{modality.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-white/80">{modality.description}</p>
                  <ul className="mt-5 space-y-3">
                    {modality.features.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-sm text-white/90"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-[#8bf3d7]" />{feature}</li>)}
                  </ul>
                  <button type="button" onClick={() => { setSelectedModality(modality.icon === 'video' ? 'virtual' : 'presencial'); setPreparedRequest(null) }} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#00786f] transition hover:bg-[#e6fbf6]">{modality.action} <Icon name="arrow" size={16} /></button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {selectedResource && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#101828]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedResource(null)
          }}
        >
          <article role="dialog" aria-modal="true" aria-labelledby="resource-title" className="my-auto max-h-[min(88vh,760px)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f0fdfc] px-3 py-1.5 text-xs font-semibold text-[#00786f]">
                  <Icon name={selectedResource.icon} size={15} /> {selectedResource.category}
                </span>
                <h2 id="resource-title" className="text-2xl font-bold leading-tight text-[#101828]">{selectedResource.title}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8a95a3]"><Icon name="clock" size={14} /> {selectedResource.time} de lectura</p>
              </div>
              <button type="button" onClick={() => setSelectedResource(null)} aria-label="Cerrar recurso" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#4a5565] hover:bg-[#e6fbf6] hover:text-[#00786f]"><Icon name="close" size={18} /></button>
            </div>
            <p className="mt-6 text-sm leading-7 text-[#4a5565]">{selectedResource.intro}</p>
            <h3 className="mt-6 text-sm font-bold text-[#101828]">Algunas ideas que pueden ayudarte</h3>
            <ul className="mt-3 space-y-3">
              {selectedResource.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm leading-6 text-[#4a5565]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6fbf6] text-[#009689]"><Icon name="check" size={13} /></span>
                  {tip}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-[#cbfbf1] bg-[#f0fdfc] p-4">
              <h3 className="text-sm font-bold text-[#005f5a]">¿Cuándo buscar apoyo?</h3>
              <p className="mt-1.5 text-sm leading-6 text-[#4a5565]">{selectedResource.support}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {selectedResource.category === 'Crisis' ? (
                <>
                  <a href="tel:115" className="inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f]"><Icon name="phone" size={16} /> Llamar a crisis estudiantil · 115</a>
                  <a href="tel:123" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-[#4a5565] hover:bg-gray-50"><Icon name="phone" size={16} /> Emergencias · 123</a>
                </>
              ) : (
                <a href="#atención" onClick={() => setSelectedResource(null)} className="inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f]">Conocer opciones de acompañamiento <Icon name="arrow" size={16} /></a>
              )}
              <button type="button" onClick={() => setSelectedResource(null)} className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-[#4a5565] hover:bg-gray-50">Cerrar</button>
            </div>
            <p className="mt-5 text-[11px] leading-5 text-[#8a95a3]">Este recurso es informativo y no reemplaza la orientación de un profesional de salud.</p>
          </article>
        </div>
      )}

      {selectedModality && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#101828]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedModality(null)
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="request-title" className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow><Icon name={selectedModality === 'virtual' ? 'video' : 'building'} size={15} /> Solicitud de acompañamiento</SectionEyebrow>
                <h2 id="request-title" className="text-2xl font-bold text-[#101828]">{modalityLabels[selectedModality]}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6a7282]">Cuéntanos cómo podemos contactarte. Prepararemos un correo con tu solicitud para que la revises y la envíes.</p>
              </div>
              <button type="button" onClick={() => setSelectedModality(null)} aria-label="Cerrar solicitud" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#4a5565] hover:bg-[#e6fbf6] hover:text-[#00786f]"><Icon name="close" size={18} /></button>
            </div>

            {!session ? (
              <div className="mt-6 rounded-2xl border border-[#cbfbf1] bg-[#f0fdfc] p-5">
                <p className="text-sm leading-6 text-[#4a5565]">Inicia sesión antes de registrar una solicitud de atención en tu cuenta.</p>
                <a href="#cuenta" onClick={() => setSelectedModality(null)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00786f]">Ir a Mi cuenta <Icon name="arrow" size={16} /></a>
              </div>
            ) : !preparedRequest ? (
              <form onSubmit={(event) => void handleRequestSubmit(event)} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-[#101828]">Nombre
                  <input required name="name" autoComplete="name" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10" placeholder="Tu nombre" />
                </label>
                <label className="block text-sm font-semibold text-[#101828]">Correo universitario
                  <input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10" placeholder="tu@universidad.edu" />
                </label>
                <label className="block text-sm font-semibold text-[#101828]">¿Cuándo te viene bien?
                  <input required name="availability" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10" placeholder="Por ejemplo: tardes entre semana" />
                </label>
                <label className="block text-sm font-semibold text-[#101828]">¿Hay algo que quieras contarnos? <span className="font-normal text-[#8a95a3]">(opcional)</span>
                  <textarea name="message" rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00bba7] focus:ring-4 focus:ring-[#00bba7]/10" placeholder="Comparte solo lo que te haga sentir cómodo/a." />
                </label>
                <label className="flex items-start gap-2.5 text-xs leading-5 text-[#4a5565]">
                  <input required name="consent" type="checkbox" className="mt-1 accent-[#009689]" />
                  Acepto guardar estos datos de contacto y mi solicitud en mi cuenta de ATARAXIA para poder consultarlos después.
                </label>
                {recordsError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{recordsError}</p>}
                <button type="submit" disabled={requestBusy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00786f] disabled:cursor-wait disabled:opacity-50">{requestBusy ? 'Guardando solicitud…' : 'Guardar y preparar correo'} <Icon name="arrow" size={16} /></button>
                <p className="text-center text-xs leading-5 text-[#8a95a3]">La solicitud se guarda en tu cuenta privada. El correo solo se enviará si lo abres y lo envías desde tu aplicación.</p>
              </form>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#cbfbf1] bg-[#f0fdfc] p-5" role="status">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#009689]"><Icon name="check" size={22} /></span>
                <h3 className="mt-3 font-bold text-[#005f5a]">Tu solicitud está lista, {preparedRequest.name}.</h3>
                <p className="mt-2 text-sm leading-6 text-[#4a5565]">La solicitud quedó guardada en tu cuenta. Aún no se ha enviado; abre tu aplicación de correo para revisarla y enviarla a Bienestar Universitario.</p>
                <a href={preparedRequest.href} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#009689] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00786f]">Abrir correo para enviar <Icon name="mail" size={16} /></a>
                <p className="mt-4 text-xs leading-5 text-[#6a7282]">Si no tienes una aplicación de correo configurada, comunícate con Bienestar Universitario en la extensión 3300.</p>
                {recordsError && <p role="alert" className="mt-3 text-sm text-red-800">{recordsError}</p>}
                <button type="button" onClick={() => setPreparedRequest(null)} className="mt-3 text-xs font-semibold text-[#00786f] hover:underline">Editar solicitud</button>
              </div>
            )}
          </section>
        </div>
      )}

      <footer className="bg-[#101828] text-white">
        <div className="bg-gradient-to-r from-[#00786f] via-[#009689] to-[#00a98e] px-5 py-12 sm:px-8">
          <div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">¿Listo para comenzar tu camino hacia el bienestar?</h2>
              <p className="mt-2 text-sm text-white/80">No tienes que hacerlo a solas. Aquí estamos para ti.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a href="#evaluación" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#00786f] transition hover:bg-[#e6fbf6]">Iniciar evaluación</a>
              <a href="#atención" className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Conocer atención</a>
            </div>
          </div>
        </div>
        <div className="px-5 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-[1160px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1.1fr]">
            <div>
              <Logo light />
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <img
                  src={`${import.meta.env.BASE_URL}universidad-linda-vista.png`}
                  alt="Escudo de la Universidad Linda Vista"
                  className="h-14 w-14 shrink-0 object-contain"
                  loading="lazy"
                />
                <p className="text-xs font-medium leading-5 text-white/65">
                  Una iniciativa de<br />
                  <span className="font-semibold text-white/90">Universidad Linda Vista</span>
                </p>
              </div>
              <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">Un espacio universitario para escucharte, orientarte y acompañarte a encontrar tu equilibrio.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold">Plataforma</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                {navLinks.map((link) => <li key={link.href}><a href={link.href} className="transition hover:text-[#00d492]">{link.label}</a></li>)}
                <li><a href="#signos" className="transition hover:text-[#00d492]">Signos vitales</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold">Contacto</h3>
              <ul className="mt-5 space-y-4 text-sm text-white/60">
                <li><a href="mailto:Kathia.aguilar@ulv.edu.mx" className="flex items-center gap-2.5 transition hover:text-white"><Icon name="mail" size={16} className="text-[#00d492]" />Kathia.aguilar@ulv.edu.mx</a></li>
                <li><a href="tel:+529371549923" className="flex items-center gap-2.5 transition hover:text-white"><Icon name="phone" size={16} className="text-[#00d492]" />+52 937 154 9923</a></li>
                <li><a href="https://maps.app.goo.gl/t6TBFPST41vhEjN79" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 transition hover:text-white"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-[#00d492]" /><span>Universidad Linda Vista<br /><span className="text-xs text-[#00d492]">Ver ubicación en Google Maps</span></span></a></li>
                <li><a href="#atención" className="inline-flex items-center gap-1.5 font-medium text-[#00d492] hover:text-white">Conoce nuestros espacios <Icon name="arrow" size={14} /></a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-[1160px] flex-col items-center text-center text-xs text-white/45 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} ATARAXIA · Bienestar Universitario. Hecho con cuidado para ti.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
