import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Tag, Database, ChevronDown, ChevronRight, FileText, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import {
  categoriesCol, questionsCol, subcategoriesCol,
  getAll, addDocument, setDocument, updateDocument, deleteDocument, subscribeCollection,
  where,
} from '../../../lib/firestore'

interface Category {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  bgColor: string
  order?: number
}

type CatDoc = Category & { _id: string }

interface Subcategory {
  categoryId: string
  parentId: string          // '' = alan (top-level), '<docId>' = alt dal
  name: string
  slug: string
  description: string
  color: string
  orderIndex: number
}

type SubDoc = Subcategory & { _id: string }

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
    .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .replace(/[&\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const SEED_SUBCATEGORIES: Record<string, string[]> = {
  yazilim: ['Frontend', 'Backend', 'Algoritma & Veri Yapıları', 'Sistem Tasarımı', 'DevOps', 'Mobil', 'Veritabanı'],
  'yapay-zeka': ['Makine Öğrenmesi', 'Derin Öğrenme', 'NLP', 'MLOps', 'Prompt Mühendisliği', 'AI Etiği'],
  kamu: ['Genel Kültür', 'Hukuk Temelleri', 'Kurum Kültürü', 'Mülakat Teknikleri'],
  banka: ['Finans Temelleri', 'Risk Yönetimi', 'Muhasebe', 'Bankacılık Ürünleri'],
  ik: ['Yetkinlik Bazlı Sorular', 'Davranışsal Sorular', 'Kariyer Motivasyonu', 'Liderlik & Yönetim'],
  vibecoding: ['Genel'],
  'vibe-coding': ['Genel'],
}

const PRESET_COLORS = [
  { color: '#3B82F6', bg: '#EFF6FF', name: 'Mavi' },
  { color: '#10B981', bg: '#ECFDF5', name: 'Yeşil' },
  { color: '#F59E0B', bg: '#FFFBEB', name: 'Altın' },
  { color: '#8B5CF6', bg: '#F5F3FF', name: 'Mor' },
  { color: '#EF4444', bg: '#FEF2F2', name: 'Kırmızı' },
  { color: '#EC4899', bg: '#FDF2F8', name: 'Pembe' },
  { color: '#14B8A6', bg: '#F0FDFA', name: 'Teal' },
  { color: '#F97316', bg: '#FFF7ED', name: 'Turuncu' },
]

function emptyForm(): Category {
  return { id: '', label: '', emoji: '📌', description: '', color: '#3B82F6', bgColor: '#EFF6FF', order: 0 }
}

function emptySubForm(): Subcategory {
  return { categoryId: '', parentId: '', name: '', slug: '', description: '', color: '#3B82F6', orderIndex: 0 }
}

// ─── Yazılım 3-kademeli hiyerarşi seed verisi ──────────────────────────────────
interface HierarchyNode { name: string; slug: string; children?: HierarchyNode[] }

const YAZILIM_HIERARCHY: HierarchyNode[] = [
  { name: 'Yazılım Geliştirme', slug: 'yazilim-gelistirme', children: [
    { name: 'Backend', slug: 'backend', children: [
      { name: 'Java Developer', slug: 'java-developer' },
      { name: '.NET Developer', slug: 'net-developer' },
      { name: 'Python Developer', slug: 'python-developer' },
      { name: 'Node.js Developer', slug: 'nodejs-developer' },
    ]},
    { name: 'Frontend', slug: 'frontend', children: [
      { name: 'React Developer', slug: 'react-developer' },
      { name: 'Angular Developer', slug: 'angular-developer' },
      { name: 'Vue Developer', slug: 'vue-developer' },
    ]},
    { name: 'Mobil', slug: 'mobil', children: [
      { name: 'Android Developer', slug: 'android-developer' },
      { name: 'iOS Developer', slug: 'ios-developer' },
      { name: 'Flutter Developer', slug: 'flutter-developer' },
    ]},
    { name: 'Full Stack', slug: 'full-stack', children: [
      { name: 'Full Stack Developer', slug: 'full-stack-developer' },
    ]},
    { name: 'Oyun / Game', slug: 'oyun-game', children: [
      { name: 'Unity Developer', slug: 'unity-developer' },
      { name: 'Unreal Engine Developer', slug: 'unreal-engine-developer' },
    ]},
  ]},
  { name: 'Analiz', slug: 'analiz', children: [
    { name: 'İş Analisti', slug: 'is-analisti' }, { name: 'Sistem Analisti', slug: 'sistem-analisti' },
    { name: 'Technical Analyst', slug: 'technical-analyst' }, { name: 'Product Analyst', slug: 'product-analyst' },
  ]},
  { name: 'Test & QA', slug: 'test-qa', children: [
    { name: 'Manual Tester', slug: 'manual-tester' }, { name: 'Test Automation Engineer', slug: 'test-automation-engineer' },
    { name: 'QA Engineer', slug: 'qa-engineer' }, { name: 'Performance Tester', slug: 'performance-tester' },
  ]},
  { name: 'Veri', slug: 'veri', children: [
    { name: 'Data Analyst', slug: 'data-analyst' }, { name: 'Data Scientist', slug: 'data-scientist' },
    { name: 'Data Engineer', slug: 'data-engineer' }, { name: 'BI Developer', slug: 'bi-developer' },
    { name: 'Database Administrator', slug: 'database-administrator' },
  ]},
  { name: 'DevOps & Sistem', slug: 'devops-sistem', children: [
    { name: 'DevOps Engineer', slug: 'devops-engineer' }, { name: 'Site Reliability Engineer', slug: 'site-reliability-engineer' },
    { name: 'System Administrator', slug: 'system-administrator' }, { name: 'CI/CD Engineer', slug: 'ci-cd-engineer' },
  ]},
  { name: 'Siber Güvenlik', slug: 'siber-guvenlik', children: [
    { name: 'SOC Analyst', slug: 'soc-analyst' }, { name: 'Penetration Tester', slug: 'penetration-tester' },
    { name: 'Security Engineer', slug: 'security-engineer' }, { name: 'GRC Specialist', slug: 'grc-specialist' },
  ]},
  { name: 'Ağ & Cloud', slug: 'ag-cloud', children: [
    { name: 'Network Engineer', slug: 'network-engineer' }, { name: 'Cloud Engineer', slug: 'cloud-engineer' },
    { name: 'Cloud Architect', slug: 'cloud-architect' },
  ]},
  { name: 'Proje & Ürün', slug: 'proje-urun', children: [
    { name: 'IT Project Manager', slug: 'it-project-manager' }, { name: 'Scrum Master', slug: 'scrum-master' },
    { name: 'Product Owner', slug: 'product-owner' }, { name: 'Product Manager', slug: 'product-manager' },
  ]},
  { name: 'UX/UI', slug: 'ux-ui', children: [
    { name: 'UX Designer', slug: 'ux-designer' }, { name: 'UI Designer', slug: 'ui-designer' },
    { name: 'Product Designer', slug: 'product-designer' }, { name: 'UX Researcher', slug: 'ux-researcher' },
  ]},
  { name: 'Kurumsal / ERP', slug: 'kurumsal-erp', children: [
    { name: 'SAP Danışmanı', slug: 'sap-danismani' }, { name: 'ABAP Developer', slug: 'abap-developer' },
  ]},
  { name: 'IT Destek', slug: 'it-destek', children: [
    { name: 'Bilgi İşlem / Help Desk', slug: 'bilgi-islem-help-desk' },
  ]},
  { name: 'Otomasyon', slug: 'otomasyon', children: [
    { name: 'RPA Developer (UiPath)', slug: 'rpa-developer-uipath' },
  ]},
]

// Eski (flat) yazılım slug → yeni hiyerarşi slug eşlemesi
// Kural: mümkün olan en spesifik (leaf/alt-dal) node'a yönlendir
const YAZILIM_LEGACY_MAP: Record<string, string> = {
  // ── Yazılım Geliştirme ──
  'frontend': 'frontend',
  'backend': 'backend',
  'mobil': 'mobil',
  'full-stack': 'full-stack',
  'oyun-game': 'oyun-game',
  'yazilim-gelistirme': 'yazilim-gelistirme',
  // Algoritma & sistem tasarımı → Backend (en çok backend mülakatlarında sorulur)
  'algoritmalar': 'backend',
  'algoritma-veri-yapilari': 'backend',
  'sistem-tasarimi': 'backend',
  // Mimari + test karışık → Test & QA
  'yazilim-mimarisi-ve-test': 'test-qa',
  // ── Test & QA ──
  'test-qa': 'test-qa',
  'test': 'qa-engineer',
  'qa': 'qa-engineer',
  'test-otomasyon': 'test-automation-engineer',
  // ── Veri ──
  'veritabani': 'database-administrator',
  'veri': 'data-analyst',
  'data': 'data-analyst',
  'bi': 'bi-developer',
  // ── DevOps & Sistem ──
  'devops': 'devops-engineer',
  'devops-sistem': 'devops-engineer',
  'sre': 'site-reliability-engineer',
  'sistem-admin': 'system-administrator',
  // ── Siber Güvenlik ──
  'siber-guvenlik': 'security-engineer',
  'soc': 'soc-analyst',
  'pentest': 'penetration-tester',
  // ── Ağ & Cloud ──
  'bulut-bilisim-cloud-computing': 'cloud-engineer',
  'ag-cloud': 'cloud-engineer',
  'cloud': 'cloud-engineer',
  'network': 'network-engineer',
  // ── Analiz ──
  'is-analistligi-ba': 'is-analisti',
  'analiz': 'is-analisti',
  'sistem-analiz': 'sistem-analisti',
  'product-analiz': 'product-analyst',
  // ── Proje & Ürün ──
  'proje-yonetimi-pm': 'it-project-manager',
  'proje-urun': 'it-project-manager',
  'scrum': 'scrum-master',
  'product-owner': 'product-owner',
  'product-manager': 'product-manager',
  // ── UX/UI ──
  'uiux-tasarimi': 'ux-designer',
  'ui-ux': 'ux-designer',
  'ux-ui': 'ux-designer',
  'ui': 'ui-designer',
  'ux': 'ux-researcher',
  // ── ERP / Kurumsal ──
  'kurumsal-erp': 'sap-danismani',
  'erp': 'sap-danismani',
  'sap': 'sap-danismani',
  'abap': 'abap-developer',
  // ── IT Destek ──
  'it-destek': 'bilgi-islem-help-desk',
  // ── Otomasyon ──
  'otomasyon': 'rpa-developer-uipath',
  'rpa': 'rpa-developer-uipath',
}

// ─── Kamu 3-kademeli hiyerarşi ─────────────────────────────────────────────────
const KAMU_HIERARCHY: HierarchyNode[] = [
  { name: 'Kamu & İdari Yönetim', slug: 'kamu-idari-yonetim', children: [
    { name: 'Adalet Bakanlığı', slug: 'adalet-bakanligi', children: [
      { name: 'Hakim / Savcı Adayı', slug: 'hakim-savci-adayi' },
      { name: 'İcra Müdürü / Yardımcısı', slug: 'icra-muduru-yardimcisi' },
      { name: 'İnfaz Koruma Memuru (İKM)', slug: 'infaz-koruma-memuru' },
      { name: 'Cezaevi Güvenlik Personeli', slug: 'cezaevi-guvenlik-personeli' },
    ]},
    { name: 'Maliye & Ekonomi', slug: 'maliye-ekonomi', children: [
      { name: 'Hazine Uzmanı', slug: 'hazine-uzmani' },
      { name: 'Gelir Uzmanı', slug: 'gelir-uzmani' },
      { name: 'Vergi Müfettişi Yardımcısı', slug: 'vergi-mufettisi-yardimcisi' },
    ]},
    { name: 'Dışişleri Bakanlığı', slug: 'disisleri-bakanligi', children: [
      { name: 'Diplomat (Aday Meslek Memuru)', slug: 'diplomat' },
    ]},
    { name: 'Genel İdare', slug: 'genel-idare', children: [
      { name: 'Devlet Memuru', slug: 'devlet-memuru' },
      { name: 'Müfettiş / Denetçi', slug: 'mufettis-denetci' },
      { name: 'Uzman / Uzman Yardımcısı', slug: 'uzman-yardimcisi' },
    ]},
  ]},
  { name: 'Güvenlik & Savunma', slug: 'guvenlik-savunma', children: [
    { name: 'TSK / Askeri', slug: 'tsk-askeri', children: [
      { name: 'Subay (Teğmen)', slug: 'subay-tegmen' },
      { name: 'Sözleşmeli Subay', slug: 'sozlesmeli-subay' },
      { name: 'Astsubay', slug: 'astsubay' },
      { name: 'Sözleşmeli Astsubay', slug: 'sozlesmeli-astsubay' },
    ]},
    { name: 'Emniyet (Polis)', slug: 'emniyet-polis', children: [
      { name: 'Polis Memuru', slug: 'polis-memuru' },
      { name: 'Komiser Yardımcısı', slug: 'komiser-yardimcisi' },
      { name: 'Komiser', slug: 'komiser' },
    ]},
    { name: 'Jandarma & Sahil Güvenlik', slug: 'jandarma-sahil-guvenlik', children: [
      { name: 'Jandarma / SGA Astsubay', slug: 'jandarma-sga-astsubay' },
      { name: 'JÖH / PGÖH Adayı', slug: 'joh-pgoh-adayi' },
    ]},
  ]},
  { name: 'Eğitim & Akademi', slug: 'egitim-akademi', children: [
    { name: 'MEB / Öğretmenlik', slug: 'meb-ogretmenlik', children: [
      { name: 'Sözleşmeli Öğretmen', slug: 'sozlesmeli-ogretmen' },
      { name: 'Öğretmen (Atamalı)', slug: 'ogretmen-atamali' },
    ]},
    { name: 'Üniversite / Akademi', slug: 'universite-akademi', children: [
      { name: 'Araştırma Görevlisi', slug: 'arastirma-gorevlisi' },
      { name: 'Öğretim Görevlisi', slug: 'ogretim-gorevlisi' },
    ]},
  ]},
  { name: 'Sağlık & Sosyal Hizmetler', slug: 'saglik-sosyal-hizmetler', children: [
    { name: 'Sağlık Bakanlığı', slug: 'saglik-bakanligi', children: [
      { name: 'Sağlık Teknikeri / Teknisyeni', slug: 'saglik-teknikeri-teknisyeni' },
      { name: 'Hemşire / ATT', slug: 'hemsire-att' },
      { name: 'Kamu Hizmetleri Uzmanı', slug: 'kamu-hizmetleri-uzmani' },
    ]},
    { name: 'Sosyal Hizmetler', slug: 'sosyal-hizmetler', children: [
      { name: 'Sosyal Hizmet Uzmanı', slug: 'sosyal-hizmet-uzmani' },
    ]},
  ]},
  { name: 'Havacılık & Ulaşım', slug: 'havacilik-ulasim', children: [
    { name: 'Uçuş Ekibi', slug: 'ucus-ekibi', children: [
      { name: 'Pilot (Cadet / YP Öğrencisi)', slug: 'pilot-cadet' },
      { name: 'Pilot (Captain)', slug: 'pilot-captain' },
    ]},
    { name: 'Kabin Ekibi', slug: 'kabin-ekibi', children: [
      { name: 'Kabin Memuru (Junior)', slug: 'kabin-memuru-junior' },
      { name: 'Kabin Memuru (Senior)', slug: 'kabin-memuru-senior' },
    ]},
    { name: 'Yer Hizmetleri', slug: 'yer-hizmetleri', children: [
      { name: 'Yer Hizmetleri Personeli', slug: 'yer-hizmetleri-personeli' },
    ]},
  ]},
]

const KAMU_LEGACY_MAP: Record<string, string> = {
  // Eski flat kamu subcategorileri
  'genel-kultur': 'devlet-memuru',
  'hukuk-temelleri': 'uzman-yardimcisi',
  'kurum-kulturu': 'devlet-memuru',
  'mulakat-teknikleri': 'devlet-memuru',
}

// ─── Banka 3-kademeli hiyerarşi ──────────────────────────────────────────────
const BANKA_HIERARCHY: HierarchyNode[] = [
  { name: 'Bireysel Bankacılık', slug: 'bireysel-bankacilik', children: [
    { name: 'Müşteri Temsilcisi / Danışmanı', slug: 'musteri-temsilcisi' },
    { name: 'Kredi Uzmanı', slug: 'kredi-uzmani' },
    { name: 'Satış Danışmanı', slug: 'satis-danismani' },
  ]},
  { name: 'Kurumsal & Ticari Bankacılık', slug: 'kurumsal-ticari', children: [
    { name: 'Kurumsal Bankacılık Uzmanı', slug: 'kurumsal-bankacilik-uzmani' },
    { name: 'Ticari Bankacılık Uzmanı', slug: 'ticari-bankacilik-uzmani' },
    { name: 'KOBİ Bankacılık Uzmanı', slug: 'kobi-bankacilik-uzmani' },
  ]},
  { name: 'Risk & Uyum', slug: 'risk-uyum', children: [
    { name: 'Risk Analisti', slug: 'risk-analisti' },
    { name: 'Uyum (Compliance) Uzmanı', slug: 'uyum-compliance-uzmani' },
    { name: 'İç Denetçi / Müfettiş', slug: 'ic-denetci-mufettis' },
  ]},
  { name: 'Sermaye Piyasaları & Yatırım', slug: 'sermaye-piyasalari', children: [
    { name: 'SPK Lisanslı Uzman', slug: 'spk-lisansli-uzman' },
    { name: 'Yatırım Danışmanı', slug: 'yatirim-danismani' },
    { name: 'Portföy Yöneticisi', slug: 'portfoy-yoneticisi' },
  ]},
  { name: 'Operasyon & Hazine', slug: 'operasyon-hazine', children: [
    { name: 'Back Office Uzmanı', slug: 'back-office-uzmani' },
    { name: 'Hazine Uzmanı', slug: 'hazine-uzmani-banka' },
    { name: 'Operasyon Uzmanı', slug: 'operasyon-uzmani' },
  ]},
  { name: 'Dijital & Fintech', slug: 'dijital-fintech', children: [
    { name: 'Dijital Bankacılık Uzmanı', slug: 'dijital-bankacilik-uzmani' },
    { name: 'Fintech Ürün Yöneticisi', slug: 'fintech-urun-yoneticisi' },
  ]},
]
const BANKA_LEGACY_MAP: Record<string, string> = {
  'finans-temelleri': 'risk-analisti',
  'risk-yonetimi': 'risk-analisti',
  'muhasebe': 'back-office-uzmani',
  'bankacilik-urunleri': 'musteri-temsilcisi',
}

// ─── İK 3-kademeli hiyerarşi ──────────────────────────────────────────────────
const IK_HIERARCHY: HierarchyNode[] = [
  { name: 'Mülakat Hazırlığı', slug: 'mulakat-hazirligi', children: [
    { name: 'Öz Tanıtım & Kariyer Hikayesi', slug: 'oz-tanitim-kariyer' },
    { name: 'Güçlü / Zayıf Yönler', slug: 'guclu-zayif-yonler' },
    { name: 'Kariyer Hedefleri', slug: 'kariyer-hedefleri' },
  ]},
  { name: 'Davranışsal & Yetkinlik', slug: 'davranissal-yetkinlik', children: [
    { name: 'STAR Yöntemi', slug: 'star-yontemi' },
    { name: 'Liderlik Soruları', slug: 'liderlik-sorulari' },
    { name: 'Takım & İşbirliği', slug: 'takim-isbirligi' },
    { name: 'Çatışma Yönetimi', slug: 'catisma-yonetimi' },
  ]},
  { name: 'Şirket & Kültür Uyumu', slug: 'sirket-kultur-uyumu', children: [
    { name: 'Şirket Araştırması', slug: 'sirket-arastirmasi' },
    { name: 'Kültürel Uyum', slug: 'kulturel-uyum' },
    { name: 'Değerler & Motivasyon', slug: 'degerler-motivasyon' },
  ]},
  { name: 'Teklif & Müzakere', slug: 'teklif-muzakere', children: [
    { name: 'Maaş Müzakeresi', slug: 'maas-muzakeresi' },
    { name: 'Çalışma Koşulları', slug: 'calisma-kosullari' },
  ]},
]
const IK_LEGACY_MAP: Record<string, string> = {
  'yetkinlik-bazli-sorular': 'star-yontemi',
  'davranissal-sorular': 'davranissal-yetkinlik',
  'kariyer-motivasyonu': 'kariyer-hedefleri',
  'liderlik-yonetim': 'liderlik-sorulari',
}

// ─── Yapay Zeka 3-kademeli hiyerarşi ─────────────────────────────────────────
const YAPAY_ZEKA_HIERARCHY: HierarchyNode[] = [
  { name: 'Makine Öğrenmesi', slug: 'makine-ogrenmesi', children: [
    { name: 'ML Engineer', slug: 'ml-engineer' },
    { name: 'Data Scientist (YZ)', slug: 'data-scientist-yz' },
    { name: 'ML Araştırmacı', slug: 'ml-arastirmaci' },
  ]},
  { name: 'Derin Öğrenme & Görü', slug: 'derin-ogrenme', children: [
    { name: 'Deep Learning Engineer', slug: 'deep-learning-engineer' },
    { name: 'Computer Vision Engineer', slug: 'computer-vision-engineer' },
    { name: 'NLP / NLU Engineer', slug: 'nlp-nlu-engineer' },
  ]},
  { name: 'Üretimsel AI (GenAI)', slug: 'uretimsel-ai', children: [
    { name: 'Prompt Engineer', slug: 'prompt-engineer' },
    { name: 'LLM Fine-tuning Uzmanı', slug: 'llm-fine-tuning-uzmani' },
    { name: 'RAG & AI Altyapı Uzmanı', slug: 'rag-ai-altyapi-uzmani' },
  ]},
  { name: 'MLOps & Üretim', slug: 'mlops-uretim', children: [
    { name: 'MLOps Engineer', slug: 'mlops-engineer' },
    { name: 'AI Platform Engineer', slug: 'ai-platform-engineer' },
  ]},
  { name: 'AI Etiği & Güvenlik', slug: 'ai-etigi-guvenlik', children: [
    { name: 'AI Ethics Uzmanı', slug: 'ai-ethics-uzmani' },
    { name: 'AI Güvenlik Araştırmacısı', slug: 'ai-guvenlik-arastirmacisi' },
  ]},
]
const YAPAY_ZEKA_LEGACY_MAP: Record<string, string> = {
  'makine-ogrenmesi': 'ml-engineer',
  'derin-ogrenme': 'deep-learning-engineer',
  'nlp': 'nlp-nlu-engineer',
  'mlops': 'mlops-engineer',
  'prompt-muhendisligi': 'prompt-engineer',
  'ai-etigi': 'ai-ethics-uzmani',
}

// ─── Tüm hiyerarşik kategoriler (seed + migrate) ────────────────────────────────
const CAT_HIERARCHIES: Record<string, HierarchyNode[]> = {
  yazilim: YAZILIM_HIERARCHY,
  kamu: KAMU_HIERARCHY,
  banka: BANKA_HIERARCHY,
  ik: IK_HIERARCHY,
  'yapay-zeka': YAPAY_ZEKA_HIERARCHY,
}
const CAT_LEGACY_MAPS: Record<string, Record<string, string>> = {
  yazilim: YAZILIM_LEGACY_MAP,
  kamu: KAMU_LEGACY_MAP,
  banka: BANKA_LEGACY_MAP,
  ik: IK_LEGACY_MAP,
  'yapay-zeka': YAPAY_ZEKA_LEGACY_MAP,
}

// ─── Shared design tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827', sidebar: '#0d1117',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(6,182,212,0.35)',
  cyan: '#8b5cf6', purple: '#06b6d4',
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: C.t1, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', color: C.t3, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
}

function Spinner() {
  return <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ color: C.t1, fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.t1)} onMouseLeave={e => (e.currentTarget.style.color = C.t3)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
            {footer && <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DeleteConfirm({ open, message, errorMsg, onCancel, onConfirm }: { open: boolean; message: string; errorMsg?: React.ReactNode; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          >
            <h3 style={{ color: C.t1, fontWeight: 700, fontSize: 15, margin: '0 0 10px' }}>Silmek istediğinden emin misin?</h3>
            <p style={{ color: C.t2, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>{message}</p>
            {errorMsg && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 24 }}>{errorMsg}</div>}
            {!errorMsg && <div style={{ marginBottom: 24 }} />}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <CancelBtn onClick={onCancel} />
              <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600 }}>Sil</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, cursor: 'pointer', background: hov ? 'rgba(255,255,255,0.06)' : 'transparent', color: C.t2, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      İptal
    </button>
  )
}

function IconBtn({ onClick, hoverColor, children }: { onClick: () => void; hoverColor: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} style={{ padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: hov ? `${hoverColor}18` : 'transparent', color: hov ? hoverColor : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}



// ─── SubTreeNode ───────────────────────────────────────────────────────────────

const DEPTH_COLORS = ['#8b5cf6', '#06b6d4', '#10b981']

function SubTreeNode({ sub, subs, depth, qCounts, onEdit, onDelete }: {
  sub: SubDoc; subs: SubDoc[]; depth: number
  qCounts: Record<string, number>
  onEdit: (s: SubDoc) => void; onDelete: (s: SubDoc) => void
}) {
  const children = subs.filter(s => s.parentId === sub._id).sort((a, b) => a.orderIndex - b.orderIndex)
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = useState(true)
  const [hov, setHov] = useState(false)
  const dotColor = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)]

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: `${depth === 0 ? 10 : 7}px 10px`,
          marginLeft: depth * 22,
          borderRadius: 8,
          background: hov ? 'rgba(255,255,255,0.04)' : (depth === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
          border: `1px solid ${depth === 0 ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
          transition: 'all 0.15s',
        }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 1, borderRadius: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div style={{ width: 14, flexShrink: 0 }} />
        )}
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, opacity: depth === 0 ? 1 : 0.65 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: depth === 0 ? C.t1 : depth === 1 ? C.t2 : '#94a3b8', fontWeight: depth === 0 ? 700 : depth === 1 ? 600 : 400, fontSize: depth === 0 ? 13 : 12, margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sub.name}
          </p>
          <p style={{ color: C.t3, fontSize: 10, margin: 0, fontFamily: 'monospace' }}>{sub.slug}</p>
        </div>
        {!hasChildren && (
          <span style={{ fontSize: 10, color: C.t3, background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
            {qCounts[sub.slug] ?? 0} soru
          </span>
        )}
        <div style={{ display: 'flex', gap: 2, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
          <IconBtn onClick={() => onEdit(sub)} hoverColor={C.cyan}><Pencil size={12} /></IconBtn>
          <IconBtn onClick={() => onDelete(sub)} hoverColor="#ef4444"><Trash2 size={12} /></IconBtn>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {children.map(child => (
            <SubTreeNode key={child._id} sub={child} subs={subs} depth={depth + 1} qCounts={qCounts} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SubcategoryPanel ──────────────────────────────────────────────────────────

function SubcategoryPanel({ cat, onClose }: { cat: CatDoc; onClose: () => void }) {
  const [subs, setSubs] = useState<SubDoc[]>([])
  const [subQCounts, setSubQCounts] = useState<Record<string, number>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<SubDoc | null>(null)
  const [subForm, setSubForm] = useState<Subcategory>(emptySubForm())
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SubDoc | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = subscribeCollection<Subcategory>(
      subcategoriesCol(),
      docs => {
        const sorted = [...docs as SubDoc[]].sort((a, b) => a.orderIndex - b.orderIndex)
        setSubs(sorted)
      },
      where('categoryId', '==', cat.id),
    )
    getAll<{ subcategory?: string }>(questionsCol(), where('category', '==', cat.id)).then(qs => {
      const counts: Record<string, number> = {}
      qs.forEach(q => { if (q.subcategory) counts[q.subcategory] = (counts[q.subcategory] ?? 0) + 1 })
      setSubQCounts(counts)
    })
    return () => unsubRef.current?.()
  }, [cat.id])

  async function handleSeedDefaults() {
    const names = SEED_SUBCATEGORIES[cat.id] || []
    if (!names.length) { toast.error('Bu kategori için varsayılan alt dal tanımlı değil.'); return }
    setSeeding(true)
    try {
      for (let i = 0; i < names.length; i++) {
        const name = names[i]
        const slug = toSlug(name)
        await addDocument(subcategoriesCol(), { categoryId: cat.id, parentId: '', name, slug, description: '', color: cat.color, orderIndex: i } as any)
      }
      toast.success(`${names.length} alt dal eklendi.`)
    } catch { toast.error('Seed eklenemedi.') }
    finally { setSeeding(false) }
  }

  async function handleSeedHierarchy() {
    const hierarchy = CAT_HIERARCHIES[cat.id]
    if (!hierarchy) return
    setSeeding(true)
    try {
      const existing = await getAll(subcategoriesCol(), where('categoryId', '==', cat.id))
      for (const doc of existing) await deleteDocument(subcategoriesCol(), (doc as any)._id)

      let total = 0
      async function seedNode(node: HierarchyNode, parentId: string, order: number) {
        const nodeId = await addDocument(subcategoriesCol(), {
          categoryId: cat.id, parentId, name: node.name, slug: node.slug,
          description: '', color: cat.color, orderIndex: order,
        } as any)
        total++
        for (let i = 0; i < (node.children ?? []).length; i++) {
          await seedNode(node.children![i], nodeId, i)
        }
      }

      for (let i = 0; i < hierarchy.length; i++) await seedNode(hierarchy[i], '', i)
      toast.success(`${existing.length} eski kayıt silindi, ${total} yeni node oluşturuldu.`)
    } catch { toast.error('Seed eklenemedi.') }
    finally { setSeeding(false) }
  }

  function openAdd() {
    setEditingSub(null)
    setSubForm({ ...emptySubForm(), categoryId: cat.id, color: cat.color, orderIndex: subs.length })
    setModalOpen(true)
  }

  function openEdit(sub: SubDoc) {
    setEditingSub(sub)
    setSubForm({ categoryId: sub.categoryId, parentId: sub.parentId ?? '', name: sub.name, slug: sub.slug, description: sub.description, color: sub.color, orderIndex: sub.orderIndex })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!subForm.name.trim()) { toast.error('Alt dal adı zorunludur.'); return }
    const slug = subForm.slug.trim() || toSlug(subForm.name)
    setSaving(true)
    try {
      if (editingSub) {
        await updateDocument(subcategoriesCol(), editingSub._id, { ...subForm, slug })
        toast.success('Alt dal güncellendi.')
      } else {
        await addDocument(subcategoriesCol(), { ...subForm, slug } as any)
        toast.success('Alt dal eklendi.')
      }
      setModalOpen(false)
    } catch { toast.error('Kaydedilemedi.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const qc = subQCounts[deleteTarget.slug] ?? 0
    if (qc > 0) {
      toast.error(`Bu alt dalda ${qc} soru var. Önce soruları taşı.`)
      setDeleteTarget(null)
      return
    }
    try { await deleteDocument(subcategoriesCol(), deleteTarget._id); toast.success('Alt dal silindi.') }
    catch { toast.error('Silinemedi.') }
    finally { setDeleteTarget(null) }
  }

  const [fc, setFc] = useState<Record<string, boolean>>({})
  const fi = (name: string): React.CSSProperties => ({ ...INPUT_STYLE, borderColor: fc[name] ? C.cyan : 'rgba(255,255,255,0.08)' })
  const fb = (name: string) => ({ onFocus: () => setFc(s => ({ ...s, [name]: true })), onBlur: () => setFc(s => ({ ...s, [name]: false })) })

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      />

      {/* Slide-over panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480, zIndex: 50, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <h2 style={{ color: C.t1, fontWeight: 700, fontSize: 16, margin: 0 }}>{cat.label}</h2>
              <span style={{ color: C.t3, fontSize: 14 }}>·</span>
              <span style={{ color: C.t2, fontSize: 14 }}>Alt Dallar</span>
            </div>
            <p style={{ color: C.t3, fontSize: 12, margin: '4px 0 0' }}>{subs.length} alt dal</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {CAT_HIERARCHIES[cat.id] && (
              <button onClick={handleSeedHierarchy} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.4)', cursor: seeding ? 'wait' : 'pointer', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontSize: 12, fontWeight: 600, opacity: seeding ? 0.6 : 1, transition: 'all 0.15s' }}>
                <Database size={13} /> {seeding ? 'Seeding...' : 'Seed Et'}
              </button>
            )}
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gradient, color: '#fff', fontSize: 12, fontWeight: 600 }}>
              <Plus size={13} /> Alt Dal Ekle
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.t1)} onMouseLeave={e => (e.currentTarget.style.color = C.t3)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: '60px 0' }}>
              <p style={{ color: C.t3, fontSize: 13, textAlign: 'center', margin: 0 }}>Bu kategoride henüz alt dal yok.</p>
              {CAT_HIERARCHIES[cat.id] && (
                <button onClick={handleSeedHierarchy} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.4)', cursor: seeding ? 'wait' : 'pointer', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', opacity: seeding ? 0.6 : 1 }}>
                  <Database size={14} /> {seeding ? 'Ekleniyor...' : '3-Kademeli Hiyerarşi Seed Et'}
                </button>
              )}
              {!CAT_HIERARCHIES[cat.id] && SEED_SUBCATEGORIES[cat.id] && (
                <button onClick={handleSeedDefaults} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: seeding ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.04)', color: C.t1, fontSize: 13, fontWeight: 600, transition: 'all 0.15s', opacity: seeding ? 0.6 : 1 }}>
                  <Database size={14} /> {seeding ? 'Ekleniyor...' : 'Varsayılan Alt Dalları Ekle'}
                </button>
              )}
            </div>
          ) : (
            <>
              {subs
                .filter(s => !s.parentId || s.parentId === '')
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map(sub => (
                  <SubTreeNode
                    key={sub._id} sub={sub} subs={subs} depth={0}
                    qCounts={subQCounts}
                    onEdit={openEdit}
                    onDelete={s => setDeleteTarget(s)}
                  />
                ))
              }
            </>
          )}
        </div>
      </motion.div>

      {/* Sub form modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSub ? 'Alt Dal Düzenle' : 'Yeni Alt Dal'}
        footer={
          <>
            <CancelBtn onClick={() => setModalOpen(false)} />
            <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? <Spinner /> : null}{editingSub ? 'Güncelle' : 'Kaydet'}</PrimaryBtn>
          </>
        }
      >
        <div>
          <label style={LABEL_STYLE}>Ad *</label>
          <input value={subForm.name} onChange={e => {
            const name = e.target.value
            setSubForm(f => ({ ...f, name, slug: toSlug(name) }))
          }} placeholder="Frontend" style={fi('name')} {...fb('name')} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Slug</label>
          <input value={subForm.slug} onChange={e => setSubForm(f => ({ ...f, slug: e.target.value }))} placeholder="frontend" style={{ ...fi('slug'), fontFamily: 'monospace' }} {...fb('slug')} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Açıklama</label>
          <textarea value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Kısa açıklama..." style={{ ...fi('desc'), resize: 'none' }} {...fb('desc')} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Sıra</label>
          <input type="number" value={subForm.orderIndex} onChange={e => setSubForm(f => ({ ...f, orderIndex: Number(e.target.value) }))} style={fi('order')} {...fb('order')} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <DeleteConfirm
        open={!!deleteTarget}
        message={`"${deleteTarget?.name ?? ''}" alt dalını silmek istediğinden emin misin?`}
        errorMsg={(subQCounts[deleteTarget?.slug ?? ''] ?? 0) > 0 ? `Bu alt dalda ${subQCounts[deleteTarget?.slug ?? '']} soru var!` : undefined}
        onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
      />
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CategoriesModule() {
  const [categories, setCategories] = useState<CatDoc[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})
  const [subcountMap, setSubcountMap] = useState<Record<string, number>>({})
  const [selectedCat, setSelectedCat] = useState<CatDoc | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CatDoc | null>(null)
  const [form, setForm] = useState<Category>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CatDoc | null>(null)
  const [catForQuestionAdd, setCatForQuestionAdd] = useState<CatDoc | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const unsubSubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = subscribeCollection<Category>(
      categoriesCol(),
      (docs) => {
        const sorted = [...docs as CatDoc[]].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setCategories(sorted)
      },
    )
    unsubSubRef.current = subscribeCollection<Subcategory>(
      subcategoriesCol(),
      docs => {
        const counts: Record<string, number> = {}
        docs.forEach(d => { counts[(d as SubDoc).categoryId] = (counts[(d as SubDoc).categoryId] ?? 0) + 1 })
        setSubcountMap(counts)
      },
    )
    getAll<{ category: string }>(questionsCol()).then(qs => {
      const counts: Record<string, number> = {}
      qs.forEach(q => { counts[q.category] = (counts[q.category] ?? 0) + 1 })
      setQuestionCounts(counts)
    })
    return () => { unsubRef.current?.(); unsubSubRef.current?.() }
  }, [])

  async function handleMigrate() {
    setMigrating(true)
    toast.loading('Migration başlıyor…', { id: 'migrate' })
    try {
      const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
      let subCreated = 0

      // Tüm hiyerarşik kategorilerin geçerli slug setlerini hesapla
      function collectHierarchySlugs(nodes: HierarchyNode[]): Set<string> {
        const set = new Set<string>()
        function walk(ns: HierarchyNode[]) { ns.forEach(n => { set.add(n.slug); if (n.children) walk(n.children) }) }
        walk(nodes)
        return set
      }
      const catValidSlugsMap: Record<string, Set<string>> = {}
      for (const catId of Object.keys(CAT_HIERARCHIES)) {
        catValidSlugsMap[catId] = collectHierarchySlugs(CAT_HIERARCHIES[catId])
      }

      // Step 0: Hiyerarşik kategorilerdeki yanlış oluşturulmuş flat subcatları temizle
      let cleaned = 0
      for (const [catId, validSlugs] of Object.entries(catValidSlugsMap)) {
        const catSubs = await getAll<{ slug: string }>(subcategoriesCol(), where('categoryId', '==', catId))
        for (const sub of catSubs) {
          if (!validSlugs.has((sub as any).slug)) {
            await deleteDocument(subcategoriesCol(), (sub as any)._id)
            cleaned++
          }
        }
      }

      // Step 1: preset seed — eğer kategori hiç alt dalı yoksa varsayılanları ekle (hiyerarşik kategoriler hariç)
      for (const cat of categories) {
        if (CAT_HIERARCHIES[cat.id]) continue
        const existing = await getAll<{ name: string }>(subcategoriesCol(), where('categoryId', '==', cat.id))
        if (existing.length === 0 && SEED_SUBCATEGORIES[cat.id]) {
          const names = SEED_SUBCATEGORIES[cat.id]
          for (let i = 0; i < names.length; i++) {
            const name = names[i]
            const slug = toSlug(name)
            await addDocument(subcategoriesCol(), { categoryId: cat.id, name, slug, description: '', color: cat.color, orderIndex: i } as any)
            subCreated++
          }
        }
      }

      // Step 2: tüm mevcut alt dalları ve soruları yükle
      let allSubs = await getAll<{ categoryId: string; name: string; slug: string }>(subcategoriesCol())
      const allQs = await getAll<{ category: string; subcategory?: string; question?: string; answer?: string; _id: string }>(questionsCol())

      // Step 3: eşleşmeyen subcategory değerlerini kategori bazında topla (yazilim hariç)
      const newSubsNeeded = new Map<string, Map<string, string>>()
      for (const q of allQs) {
        if (!q.subcategory?.trim()) continue
        if (CAT_HIERARCHIES[q.category]) continue  // hiyerarşik kategoriler için yeni subcat oluşturma
        const catSubs = allSubs.filter(s => (s as any).categoryId === q.category)
        const qSlug = toSlug(q.subcategory)
        const qNorm = q.subcategory.toLowerCase()
        const match =
          catSubs.find(s => s.slug === qSlug) ||
          catSubs.find(s => s.slug.includes(qSlug) || qSlug.includes(s.slug)) ||
          catSubs.find(s => s.name.toLowerCase().includes(qNorm) || qNorm.includes(s.name.toLowerCase()))
        if (!match) {
          if (!newSubsNeeded.has(q.category)) newSubsNeeded.set(q.category, new Map())
          const nameMap = newSubsNeeded.get(q.category)!
          if (!nameMap.has(qSlug)) nameMap.set(qSlug, q.subcategory.trim())
        }
      }

      // Step 4: eşleşmeyen subcategory'leri otomatik oluştur (yazilim zaten atlandı)
      for (const [catId, slugToName] of newSubsNeeded) {
        const cat = catMap[catId]
        const existingInCat = allSubs.filter(s => (s as any).categoryId === catId)
        let orderIndex = existingInCat.length
        for (const [slug, name] of slugToName) {
           await addDocument(subcategoriesCol(), {
            categoryId: catId, name, slug, description: '',
            color: cat?.color ?? '#3b82f6', orderIndex: orderIndex++,
          } as any)
          subCreated++
        }
      }

      // Step 5: yeni oluşturulanlar dahil tüm alt dalları tekrar yükle
      if (newSubsNeeded.size > 0 || cleaned > 0) {
        allSubs = await getAll<{ categoryId: string; name: string; slug: string }>(subcategoriesCol())
      }

      // Step 6: soruları doğru slug'a güncelle ve boş olanları otomatik kategorize et
      let updated = 0
      for (const q of allQs) {
        let currentSub = q.subcategory?.trim()
        
        // Eğer alt dal boşsa, sorunun metnine göre (keyword eşleşmesi) otomatik atama yapalım
        if (!currentSub) {
           const qText = ((q.question || '') + ' ' + (q.answer || '')).toLowerCase()
           const validSlugs = catValidSlugsMap[q.category]
           let bestMatch = ''
           
           if (validSlugs) {
              const sortedSlugs = Array.from(validSlugs).sort((a, b) => b.length - a.length)
              for (const slug of sortedSlugs) {
                 let keyword = slug.replace(/-developer|-engineer|-uzmani|-arastirmaci|-memuru|-adayi|-danismani|-designer|-tester|-master|-owner|-analyst/g, '').replace(/-/g, ' ').trim()
                 if (keyword.length > 2 && qText.includes(keyword)) {
                    bestMatch = slug
                    break
                 }
              }
           } else {
              const catSubs = allSubs.filter(s => (s as any).categoryId === q.category)
              const sortedSubs = [...catSubs].sort((a, b) => b.slug.length - a.slug.length)
              for (const sub of sortedSubs) {
                 const keyword = sub.slug.replace(/-/g, ' ').trim()
                 if (keyword.length > 2 && qText.includes(keyword)) {
                    bestMatch = sub.slug
                    break
                 }
              }
           }
           
           if (bestMatch) {
              await updateDocument(questionsCol(), q._id, { subcategory: bestMatch })
              updated++
           }
           continue
        }

        // Eğer mevcut subcategory varsa
        const validSlugs = catValidSlugsMap[q.category]
        if (validSlugs) {
          // Zaten geçerli bir hiyerarşi slug'u ise dokunma
          if (validSlugs.has(currentSub)) continue
          // Legacy map'ten yeni slug'u bul
          const mappedSlug = CAT_LEGACY_MAPS[q.category]?.[currentSub]
          if (mappedSlug && validSlugs.has(mappedSlug) && mappedSlug !== currentSub) {
            await updateDocument(questionsCol(), q._id, { subcategory: mappedSlug })
            updated++
          }
          continue
        }

        // Diğer kategoriler: fuzzy matching
        const catSubs = allSubs.filter(s => (s as any).categoryId === q.category)
        if (!catSubs.length) continue
        const qSlug = toSlug(currentSub)
        const qNorm = currentSub.toLowerCase()
        const match =
          catSubs.find(s => s.slug === qSlug) ||
          catSubs.find(s => s.slug.includes(qSlug) || qSlug.includes(s.slug)) ||
          catSubs.find(s => s.name.toLowerCase().includes(qNorm) || qNorm.includes(s.name.toLowerCase()))
        if (match && match.slug !== currentSub) {
          await updateDocument(questionsCol(), q._id, { subcategory: match.slug })
          updated++
        }
      }

      const parts = []
      if (cleaned > 0) parts.push(`${cleaned} hatalı yazılım subcategory silindi`)
      if (subCreated > 0) parts.push(`${subCreated} yeni alt dal oluşturuldu`)
      if (updated > 0) parts.push(`${updated} soru güncellendi ve atandı`)
      if (parts.length === 0) parts.push('Her şey güncel')
      toast.success(parts.join(', ') + '.', { id: 'migrate' })
    } catch {
      toast.error('Migration sırasında hata oluştu.', { id: 'migrate' })
    } finally {
      setMigrating(false)
    }
  }

  function openAdd() { setEditing(null); setForm({ ...emptyForm(), order: categories.length }); setModalOpen(true) }
  function openEdit(cat: CatDoc) { setEditing(cat); setForm({ ...cat }); setModalOpen(true) }

  async function handleSave() {
    if (!form.id.trim() || !form.label.trim()) { toast.error('ID ve isim zorunludur.'); return }
    setSaving(true)
    try {
      if (editing) { await updateDocument(categoriesCol(), editing._id, form); toast.success('Kategori güncellendi.') }
      else { await setDocument(categoriesCol(), form.id, form); toast.success('Kategori eklendi.') }
      setModalOpen(false)
    } catch { toast.error('Kaydedilemedi.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const catToDelete = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteDocument(categoriesCol(), catToDelete._id)
      toast(`"${catToDelete.label}" silindi`, {
        action: {
          label: 'Geri Al',
          onClick: async () => {
            try {
              const { _id, ...catData } = catToDelete
              await setDocument(categoriesCol(), catToDelete.id, catData)
              toast.success('Kategori geri alındı.')
            } catch {
              toast.error('Geri alınamadı.')
            }
          },
        },
        duration: 5000,
      })
    } catch { toast.error('Silinemedi.') }
  }

  const [fc, setFc] = useState<Record<string, boolean>>({})
  const fi = (name: string): React.CSSProperties => ({ ...INPUT_STYLE, borderColor: fc[name] ? C.cyan : 'rgba(255,255,255,0.08)' })
  const fb = (name: string) => ({ onFocus: () => setFc(s => ({ ...s, [name]: true })), onBlur: () => setFc(s => ({ ...s, [name]: false })) })

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.t1, fontWeight: 700, fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={22} style={{ color: C.cyan }} /> Kategoriler
          </h1>
          <p style={{ color: C.t3, fontSize: 13, margin: '4px 0 0' }}>{categories.length} kategori · Karta tıkla → alt dalları yönet</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleMigrate} disabled={migrating}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: migrating ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.04)', color: C.t2, fontSize: 13, fontWeight: 600, opacity: migrating ? 0.6 : 1, transition: 'all 0.15s' }}
            title="Mevcut soruları alt dal slug'larına eşle, eksik alt dalları oluştur"
          >
            <Database size={14} /> {migrating ? 'Migrate ediliyor…' : 'Soruları Migrate Et'}
          </button>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(139,92,246,0.25)' }}
          >
            <Plus size={15} /> Kategori Ekle
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {categories.map(cat => (
          <CatCard
            key={cat._id} cat={cat} count={questionCounts[cat.id] ?? 0}
            subcount={subcountMap[cat.id] ?? 0}
            onEdit={() => openEdit(cat)} onDelete={() => setDeleteTarget(cat)}
            onOpenPanel={() => setSelectedCat(cat)}
            onAddQuestion={() => setCatForQuestionAdd(cat)}
          />
        ))}
      </div>

      {/* Category form modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Kategori Düzenle' : 'Yeni Kategori'}
        footer={
          <>
            <CancelBtn onClick={() => setModalOpen(false)} />
            <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? <Spinner /> : null}{editing ? 'Güncelle' : 'Kaydet'}</PrimaryBtn>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>ID * <span style={{ fontWeight: 400, textTransform: 'none' }}>(slug)</span></label>
            <input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} disabled={!!editing} placeholder="yazilim" style={{ ...fi('id'), opacity: editing ? 0.5 : 1 }} {...fb('id')} />
          </div>
          <div>
            <label style={LABEL_STYLE}>İsim *</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Yazılım" style={fi('label')} {...fb('label')} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="💻" style={fi('emoji')} {...fb('emoji')} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Sıra</label>
            <input type="number" value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} style={fi('order')} {...fb('order')} />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Açıklama</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Kısa açıklama..." style={{ ...fi('desc'), resize: 'none' }} {...fb('desc')} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Renk</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_COLORS.map(({ color, bg, name }) => (
              <button
                key={color} type="button" title={name} onClick={() => setForm(f => ({ ...f, color, bgColor: bg }))}
                style={{
                  width: 28, height: 28, borderRadius: 8, background: color, border: 'none', cursor: 'pointer',
                  boxShadow: form.color === color ? `0 0 0 2px ${C.card}, 0 0 0 4px ${color}` : 'none',
                  transform: form.color === color ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s'
                }}
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <DeleteConfirm
        open={!!deleteTarget}
        message={`"${deleteTarget?.label ?? ''}" kategorisini silmek istediğinden emin misin?`}
        errorMsg={(questionCounts[deleteTarget?.id ?? ''] ?? 0) > 0 ? <span style={{ color: '#f59e0b' }}>Bu kategorideki {questionCounts[deleteTarget?.id ?? '']} soru veritabanında kalacak.</span> : undefined}
        onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
      />

      {/* Subcategory panel */}
      <AnimatePresence>
        {selectedCat && (
          <SubcategoryPanel key={selectedCat._id} cat={selectedCat} onClose={() => setSelectedCat(null)} />
        )}
      </AnimatePresence>

      {/* Add Question Bulk Modal */}
      {catForQuestionAdd && (
        <CategoryBulkAddModal cat={catForQuestionAdd} onClose={() => setCatForQuestionAdd(null)} />
      )}
    </div>
  )
}

// ─── CatCard ───────────────────────────────────────────────────────────────────

function CatCard({ cat, count, subcount, onEdit, onDelete, onOpenPanel, onAddQuestion }: { cat: CatDoc; count: number; subcount: number; onEdit: () => void; onDelete: () => void; onOpenPanel: () => void; onAddQuestion: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onOpenPanel}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all 0.15s', transform: hov ? 'translateY(-2px)' : 'none', boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.3)` : 'none',
        borderColor: hov ? C.borderHover : C.border, cursor: 'pointer',
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: cat.color + '20' }}>
            {cat.emoji}
          </div>
          <div>
            <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{cat.label}</p>
            <p style={{ color: C.t3, fontSize: 11, margin: 0, fontFamily: 'monospace' }}>{cat.id}</p>
          </div>
        </div>
        {/* Stop propagation so card click (open panel) doesn't fire */}
        <div style={{ display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }} onClick={e => e.stopPropagation()}>
          <IconBtn onClick={onEdit} hoverColor={C.cyan}><Pencil size={14} /></IconBtn>
          <IconBtn onClick={onDelete} hoverColor="#ef4444"><Trash2 size={14} /></IconBtn>
        </div>
      </div>

      <p style={{ color: C.t2, fontSize: 12, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {cat.description || 'Açıklama yok.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
          <span style={{ color: C.t3, fontSize: 11, fontFamily: 'monospace' }}>{cat.color}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: C.t1, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>
            {count} Soru
          </span>
          <span style={{ color: cat.color, fontSize: 11, fontWeight: 700, background: cat.color + '18', padding: '4px 8px', borderRadius: 6 }}>
            {subcount} Alt Dal
          </span>
        </div>
      </div>

      <button 
        onClick={e => { e.stopPropagation(); onAddQuestion(); }} 
        style={{ marginTop: 6, padding: '10px', borderRadius: 8, border: 'none', background: 'rgba(6, 182, 212, 0.12)', color: C.cyan, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
      >
        <BookOpen size={15} /> Kategoriye Sorular Ekle
      </button>
    </div>
  )
}

// ─── CategoryBulkAddModal ──────────────────────────────────────────────────────

function CategoryBulkAddModal({ cat, onClose }: { cat: CatDoc; onClose: () => void }) {
  const [subs, setSubs] = useState<SubDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [importRaw, setImportRaw] = useState('')
  const [importParsed, setImportParsed] = useState<any[] | null>(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    getAll<Subcategory>(subcategoriesCol(), where('categoryId', '==', cat.id))
      .then(d => setSubs(d as SubDoc[]))
      .finally(() => setLoading(false))
  }, [cat.id])

  const leafSubs = subs.filter(s => !subs.some(child => child.parentId === s._id))

  function buildPrompt() {
    return `Aşağıdaki JSON formatında "${cat.label}" kategorisinin alt dalları (konuları) için mülakat soruları oluştur.
Her bir konu için EN AZ 20 soru hazırla. TOPLAM ${leafSubs.length > 0 ? leafSubs.length * 20 : 20} soru beklendiğini unutma.

İstenen Alt Dallar:
${leafSubs.length > 0 ? leafSubs.map(s => `- ${s.name} (slug: ${s.slug})`).join('\n') : '- Genel (slug: genel)'}

Sadece aşağıdaki JSON Array formatını döndür — başka hiçbir açıklama yapma:
[
  {
    "category": "${cat.id}",
    "subcategory": "[ilgili_alt_dal_slug]",
    "difficulty": "orta",
    "question": "Soru metni burada",
    "answer": "Model cevap burada (2-4 cümle, açıklayıcı)",
    "hints": ["İpucu 1", "İpucu 2", "İpucu 3"],
    "options": [
      { "label": "A", "text": "Seçenek A metni", "correct": false },
      { "label": "B", "text": "Doğru seçenek metni", "correct": true },
      { "label": "C", "text": "Seçenek C metni", "correct": false },
      { "label": "D", "text": "Seçenek D metni", "correct": false }
    ]
  }
] 

Kurallar:
- Her soruda tam olarak 4 şık (A, B, C, D) ve sadece 1 doğru şık olmalı.
- "difficulty" olarak sadece "kolay", "orta" veya "zor" değerlerinden birini kullan.
- "category" alanı daima "${cat.id}" olacak.
- "subcategory" alanı yukarıda belirtilen slug'lardan biri olacak.`
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildPrompt()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function parseImport(text: string) {
    setImportRaw(text)
    if (!text.trim()) { setImportParsed(null); setImportError(''); return }
    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) { setImportError('JSON bir dizi (array) olmalı.'); setImportParsed(null); return }
      
      const valid = data.filter((q: any) => q.question && q.answer && (q.category === cat.id || !q.category))
      const skipped = data.length - valid.length
      setImportError(skipped > 0 ? `${skipped} soru atlanacak (eksik question/answer alanı).` : '')
      
      // Eğer AI id olarak category döndürmediyse biz ekleyelim
      const parsed = valid.map((q: any) => ({
        ...q,
        category: cat.id,
        difficulty: q.difficulty || 'orta',
        options: Array.isArray(q.options) ? q.options : [],
        hints: Array.isArray(q.hints) ? q.hints : []
      }))
      
      setImportParsed(parsed)
    } catch {
      setImportError('Geçersiz JSON formatı. Bir dizi array olmalı.')
      setImportParsed(null)
    }
  }

  async function handleImport() {
    if (!importParsed?.length) return
    setImporting(true)
    let success = 0, fail = 0
    for (const q of importParsed) {
      try {
        await addDocument(questionsCol(), q as any)
        success++
      } catch (err) { 
        console.error('Import hatası:', err)
        fail++ 
      }
    }
    setImporting(false)
    if (fail === 0) toast.success(`${success} soru başarıyla eklendi!`)
    else toast.error(`${success} başarılı, ${fail} hata ile karşılaştı.`)
    onClose()
  }

  return (
    <Modal open={true} onClose={() => !importing && onClose()} title={`"${cat.label}" için Soru Ekle`}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <PrimaryBtn onClick={handleImport} disabled={!importParsed?.length || importing}>
            {importing ? <Spinner /> : null}
            {importParsed ? `${importParsed.length} Soruyu Yükle` : 'Yükle'}
          </PrimaryBtn>
        </>
      }
    >
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.t3 }}>Yükleniyor...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ color: C.purple, fontSize: 13, fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              ✦ AI ile Soruları Oluştur
            </p>
            <p style={{ color: C.t2, fontSize: 12, margin: '0 0 12px', lineHeight: 1.6 }}>
              Bu kategorideki <strong>{leafSubs.length}</strong> alt dal için prompt hazırlandı. Kopyalayıp AI'a (ChatGPT/Claude) yapıştır.
            </p>
            <textarea
              readOnly
              value={buildPrompt()}
              rows={5}
              style={{ ...INPUT_STYLE, resize: 'none', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5, color: 'rgba(148,163,184,0.7)', cursor: 'text' }}
            />
            <button
              onClick={handleCopy}
              style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(139,92,246,0.4)'}`, background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)', color: copied ? '#34d399' : C.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {copied ? <><CheckCircle2 size={13} /> Kopyalandı!</> : <><FileText size={13} /> Promptu Kopyala</>}
            </button>
          </div>

          <div>
             <label style={LABEL_STYLE}>JSON'u Buraya Yapıştır</label>
             <textarea
               value={importRaw}
               onChange={e => parseImport(e.target.value)}
               placeholder='[{"category": "banka", "subcategory": "...", ...}]'
               rows={8}
               style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
             />
          </div>

          {importError && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertCircle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#fbbf24', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{importError}</p>
            </div>
          )}
          {importParsed && importParsed.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
              <p style={{ color: '#34d399', fontSize: 12, fontWeight: 700, margin: 0 }}>{importParsed.length} soru veritabanına eklenmeye hazır</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
