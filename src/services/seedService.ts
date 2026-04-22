import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from './productService';
import { Page } from './pageService';
import { SiteSettings } from './settingsService';

const COLLECTION_NAME = 'products';
const PAGES_COLLECTION = 'pages';

export const seedService = {
  async seedAll() {
    console.log('Starting full database seed...');
    try {
      console.log('Seeding settings...');
      await this.seedSettings();
      console.log('Seeding pages...');
      await this.seedPages();
      console.log('Seeding products...');
      await this.seedProducts();
      console.log('Seeding FAQs...');
      await this.seedFaqs();
      console.log('Seeding babalawos...');
      await this.seedBabalawos();
      console.log('Seeding videos...');
      await this.seedVideos();
      console.log('Seeding courses...');
      await this.seedCourses();
      console.log('Full database seed completed.');
    } catch (error) {
      console.error('Seed process failed at some step:', error);
      throw error;
    }
  },

  async seedSettings() {
    const docRef = doc(db, 'settings', 'site_settings');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const initialSettings: SiteSettings = {
        siteName: 'OBA ELA',
        siteTagline: 'Trado Medical',
        logoUrl: '',
        faviconUrl: '',
        footerText: '© 2026 OBA ELA TRADO MEDICAL HEALING LIMITED. All rights reserved.',
        contactEmail: 'contact@obaela.com',
        contactPhone: '+234 800 OBA ELA',
        contactAddress: 'Sacred Temple, Earth',
        socialLinks: {
          facebook: 'https://facebook.com/obaela',
          instagram: 'https://instagram.com/obaela',
          twitter: 'https://twitter.com/obaela',
          youtube: 'https://youtube.com/obaela',
          whatsapp: 'https://wa.me/2348000000000'
        },
        maintenanceMode: false,
        ecommerce: {
          defaultCurrency: 'NGN',
          taxRate: 0,
          shippingFee: 2000,
          consultationPrice: 15000,
          paystackPublicKey: 'pk_test_placeholder'
        },
        appearance: {
          primaryColor: '#1a3c34',
          accentColor: '#d4af37',
          fontFamily: 'serif'
        }
      };
      await setDoc(docRef, initialSettings);
      console.log('Site settings seeded.');
    }
  },

  async seedPages() {
    const pagesRef = collection(db, PAGES_COLLECTION);
    const q = await getDocs(pagesRef);
    
    if (q.empty) {
      const initialPages: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          slug: 'home',
          title: 'OBA ELA TRADO MEDICAL',
          content: 'Connecting you to the ancestral traditions of Ifa and Orisha. Traditional African healing, spiritual guidance, and the path to your true destiny.',
          isPublished: true
        },
        {
          slug: 'academy',
          title: 'Ilé-Àkọ́ni-lọ́gbọ́n',
          content: '# Ilé-Àkọ́ni-lọ́gbọ́n\n\nLearn the sacred arts of Ifa divination, herbal medicine, and Yoruba spiritual philosophy. Our courses are designed for both beginners and advanced practitioners.',
          isPublished: true
        },
        {
          slug: 'store',
          title: 'Store',
          content: '# Sacred Marketplace\n\nExplore our collection of authentic herbal remedies, spiritual tools, and consecrated items prepared with ancient wisdom.',
          isPublished: true
        },
        {
          slug: 'consultation',
          title: 'Consultation',
          content: '# Spiritual Consultation\n\nBook a private session with our experienced healers for Ifa divination, spiritual guidance, and personalized herbal recommendations.',
          isPublished: true
        },
        {
          slug: 'gallery',
          title: 'Gallery',
          content: '# Sacred Moments\n\nA visual journey through our center, ceremonies, and the natural beauty of our herbal gardens.',
          isPublished: true
        }
      ];

      for (const page of initialPages) {
        await addDoc(pagesRef, {
          ...page,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log('Initial pages seeded.');
    }
  },

  async seedProducts() {
    const productsRef = collection(db, COLLECTION_NAME);
    
    // Check if Jagunlabi Bitters already exists
    const q = query(productsRef, where('name', '==', 'Jagunlabi Bitters'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      const jagunlabi: Omit<Product, 'id'> = {
        name: 'Jagunlabi Bitters',
        description: 'Authentic traditional herbal bitters for overall wellness, vitality, and digestive health. Prepared with sacred herbs and ancient wisdom.',
        price: 5000,
        category: 'Herbal Bitters',
        imageUrl: 'https://picsum.photos/seed/bitters/600/600',
        stock: 100,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(productsRef, jagunlabi);
      console.log('Jagunlabi Bitters added to store.');
    } else {
      console.log('Jagunlabi Bitters already exists in store.');
    }

    // Optional: Add other common products if the store is empty
    const allProducts = await getDocs(productsRef);
    if (allProducts.size <= 1) {
      const initialProducts: Omit<Product, 'id'>[] = [
        {
          name: 'Spiritual Cleansing Soap',
          description: 'Consecrated soap for removing negative energy and attracting favor.',
          price: 3500,
          category: 'Spiritual Items',
          imageUrl: 'https://picsum.photos/seed/soap/600/600',
          stock: 50,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Ifa Divination Tray (Opon Ifa)',
          description: 'Hand-carved wooden tray for Ifa divination ceremonies.',
          price: 25000,
          category: 'Sacred Tools',
          imageUrl: 'https://picsum.photos/seed/tray/600/600',
          stock: 5,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Traditional Healing Oil',
          description: 'Multi-purpose herbal oil for physical and spiritual wellness.',
          price: 4500,
          category: 'Herbal Medicine',
          imageUrl: 'https://picsum.photos/seed/oil/600/600',
          stock: 75,
          createdAt: new Date().toISOString()
        }
      ];

      for (const product of initialProducts) {
        await addDoc(productsRef, product);
      }
      console.log('Initial products seeded.');
    }
  },

  async seedFaqs() {
    const faqsRef = collection(db, 'faqs');
    const q = await getDocs(faqsRef);
    
    if (q.empty) {
      const initialFaqs = [
        { question: "What is Ifa?", answer: "Ifa is a system of divination and a religion of the Yoruba people. It is also practiced in the Americas and the Caribbean.", category: "General", order: 1, isPublished: true },
        { question: "Who is Orunmila?", answer: "Orunmila is the Orisha of wisdom, knowledge, and divination. He is the master of Ifa.", category: "General", order: 2, isPublished: true },
        { question: "What is an Orisha?", answer: "Orishas are spirits that represent the various manifestations of Olodumare (God) in the Yoruba religion.", category: "General", order: 3, isPublished: true },
        { question: "How can I book a consultation?", answer: "You can book a consultation through our website's Consultation page by selecting a date and time.", category: "Services", order: 4, isPublished: true },
        { question: "What should I expect during an Ifa divination?", answer: "During a divination, the Babalawo will use sacred tools like the Opon Ifa and Ikin to communicate with Orunmila and provide guidance for your life.", category: "Services", order: 5, isPublished: true },
        { question: "Are your herbal products safe?", answer: "Yes, our herbal products are prepared using traditional methods and natural ingredients. However, we recommend consulting with our healers before use.", category: "Products", order: 6, isPublished: true },
        { question: "How do I use the Jagunlabi Bitters?", answer: "Jagunlabi Bitters should be taken as directed on the bottle, usually a small amount before or after meals for digestive health.", category: "Products", order: 7, isPublished: true },
        { question: "Can I learn Ifa online?", answer: "Yes, our Academy offers various courses that you can take online to learn about Ifa and Yoruba culture.", category: "Academy", order: 8, isPublished: true },
        { question: "What is the significance of the Opon Ifa?", answer: "The Opon Ifa is a sacred wooden tray used in divination to mark the Odu Ifa (sacred signs).", category: "General", order: 9, isPublished: true },
        { question: "Who are the Babalawos?", answer: "Babalawos are priests of Ifa who have undergone extensive training in divination, herbal medicine, and spiritual guidance.", category: "General", order: 10, isPublished: true },
        // Adding more to reach 50
        { question: "What is Esu's role?", answer: "Esu is the messenger Orisha who facilitates communication between humans and the divine.", category: "General", order: 11, isPublished: true },
        { question: "What is an Ibori ceremony?", answer: "Ibori is a ceremony to feed and align one's inner head (Ori) for spiritual balance.", category: "Services", order: 12, isPublished: true },
        { question: "How long is the Ifa training?", answer: "Traditional Ifa training can take many years, often starting in childhood, but our academy offers structured modules.", category: "Academy", order: 13, isPublished: true },
        { question: "What are the 16 major Odu?", answer: "The 16 major Odu are the primary patterns of Ifa divination, from Eji Ogbe to Ofun Meji.", category: "General", order: 14, isPublished: true },
        { question: "Do you ship internationally?", answer: "Yes, we ship our herbal products and spiritual tools worldwide.", category: "Orders", order: 15, isPublished: true },
        { question: "What is the meaning of 'Ase'?", answer: "Ase is the divine life force or power that exists in all things and makes things happen.", category: "General", order: 16, isPublished: true },
        { question: "Can I visit the center in person?", answer: "Yes, we welcome visitors to our traditional medical center for consultations and treatments.", category: "General", order: 17, isPublished: true },
        { question: "What is the purpose of spiritual baths?", answer: "Spiritual baths are used to cleanse the aura, remove negative energy, and attract positive vibrations.", category: "Services", order: 18, isPublished: true },
        { question: "How do I store herbal medicines?", answer: "Herbal medicines should be stored in a cool, dry place away from direct sunlight.", category: "Products", order: 19, isPublished: true },
        { question: "What is the role of an Iyanifa?", answer: "An Iyanifa is a female priestess of Ifa who performs similar roles to a Babalawo.", category: "General", order: 20, isPublished: true },
        { question: "What is an Osun staff?", answer: "The Osun staff is a sacred metal staff representing the Orisha Osanyin, the master of herbs.", category: "Sacred Tools", order: 21, isPublished: true },
        { question: "How often should I have a divination?", answer: "It depends on your needs, but many people have a divination at least once a month or during major life transitions.", category: "Services", order: 22, isPublished: true },
        { question: "What is the importance of ancestors in Ifa?", answer: "Ancestors (Egungun) are highly revered as they provide protection and guidance to their descendants.", category: "General", order: 23, isPublished: true },
        { question: "What is an Ile-Ifa?", answer: "An Ile-Ifa is a house or temple dedicated to the worship and study of Ifa.", category: "General", order: 24, isPublished: true },
        { question: "Are there dietary restrictions in Ifa?", answer: "Some Odu Ifa may prescribe specific taboos (eewo) for individuals, which can include dietary restrictions.", category: "General", order: 25, isPublished: true },
        { question: "What is the 'Hand of Ifa' (Owofakan)?", answer: "Owofakan is the first level of initiation into Ifa for men, providing them with their life's path.", category: "Services", order: 26, isPublished: true },
        { question: "What is 'Isefa' for women?", answer: "Isefa is the equivalent of the Hand of Ifa for women, marking their initiation into the mysteries of Ifa.", category: "Services", order: 27, isPublished: true },
        { question: "How do I know which Orisha is my guardian?", answer: "This is typically determined through a specific divination ceremony performed by a Babalawo.", category: "General", order: 28, isPublished: true },
        { question: "What is the significance of the color white in Ifa?", answer: "White represents purity, peace, and the Orisha Obatala, the creator of human bodies.", category: "General", order: 29, isPublished: true },
        { question: "What is 'Ebbo'?", answer: "Ebbo is a sacrifice or offering made to the Orishas to resolve problems or give thanks.", category: "Services", order: 30, isPublished: true },
        { question: "Can Ifa help with health issues?", answer: "Yes, Ifa combines spiritual guidance with traditional herbal medicine to address various health concerns.", category: "Services", order: 31, isPublished: true },
        { question: "What is the 'Opon Igede'?", answer: "It is a specialized divination tray used for specific types of spiritual inquiries.", category: "Sacred Tools", order: 32, isPublished: true },
        { question: "Who is Sango?", answer: "Sango is the Orisha of thunder, lightning, justice, and virility.", category: "General", order: 33, isPublished: true },
        { question: "Who is Osun?", answer: "Osun is the Orisha of love, beauty, fertility, and fresh waters.", category: "General", order: 34, isPublished: true },
        { question: "Who is Ogun?", answer: "Ogun is the Orisha of iron, war, technology, and clearing paths.", category: "General", order: 35, isPublished: true },
        { question: "Who is Yemoja?", answer: "Yemoja is the mother of all Orishas and the spirit of the oceans.", category: "General", order: 36, isPublished: true },
        { question: "What is the 'Ikin Ifa'?", answer: "Ikin are sacred palm nuts used by Babalawos to consult the wisdom of Orunmila.", category: "Sacred Tools", order: 37, isPublished: true },
        { question: "What is the 'Opele'?", answer: "The Opele is a divination chain used for quicker inquiries compared to the Ikin.", category: "Sacred Tools", order: 38, isPublished: true },
        { question: "What is the 'Iroke Ifa'?", answer: "The Iroke is a tapper used to invoke the presence of Orunmila during divination.", category: "Sacred Tools", order: 39, isPublished: true },
        { question: "What is 'Ori'?", answer: "Ori is one's spiritual head and destiny, considered the most important 'deity' to an individual.", category: "General", order: 40, isPublished: true },
        { question: "How do I start my spiritual journey?", answer: "Starting with a consultation is the best way to understand your path and what steps to take.", category: "General", order: 41, isPublished: true },
        { question: "What is the 'Itan'?", answer: "Itan are the sacred stories and myths that explain the origins and lessons of the Orishas.", category: "General", order: 42, isPublished: true },
        { question: "What is 'Akose'?", answer: "Akose are traditional herbal preparations used for specific spiritual or physical purposes.", category: "Products", order: 43, isPublished: true },
        { question: "Can I practice Ifa alongside other religions?", answer: "Many people do, as Ifa is often seen as a philosophy and way of life that can complement other beliefs.", category: "General", order: 44, isPublished: true },
        { question: "What is the 'Odu' of the year?", answer: "It is a divination performed annually to provide guidance for the community for the coming year.", category: "General", order: 45, isPublished: true },
        { question: "What is the significance of the kola nut (Obi)?", answer: "Kola nuts are used for simple divination and as offerings to guests and spirits.", category: "General", order: 46, isPublished: true },
        { question: "What is 'Omi Tutu'?", answer: "Omi Tutu is 'cool water' used in ceremonies to bring peace and appease the spirits.", category: "General", order: 47, isPublished: true },
        { question: "Who is Obatala?", answer: "Obatala is the Orisha of purity, wisdom, and the creator of human form.", category: "General", order: 48, isPublished: true },
        { question: "Who is Oya?", answer: "Oya is the Orisha of winds, tempests, and the guardian of the gates of the cemetery.", category: "General", order: 49, isPublished: true },
        { question: "What is the 'Aje' Orisha?", answer: "Aje is the Orisha of wealth, prosperity, and commerce.", category: "General", order: 50, isPublished: true }
      ];

      for (const faq of initialFaqs) {
        await addDoc(faqsRef, {
          ...faq,
          createdAt: serverTimestamp()
        });
      }
      console.log('50 FAQs seeded.');
    }
  },

  async seedBabalawos() {
    const ref = collection(db, 'babalawos');
    const q = await getDocs(ref);
    if (q.empty) {
      const initial = [
        { name: "Baba Ifagbemi", specialty: "Ifa Divination", bio: "Expert in sacred divination and spiritual alignment.", availability: "Mon-Fri", imageUrl: "https://picsum.photos/seed/baba1/400/400" },
        { name: "Baba Ifakayode", specialty: "Herbal Medicine", bio: "Master herbalist with 30 years of experience.", availability: "Tue-Sat", imageUrl: "https://picsum.photos/seed/baba2/400/400" }
      ];
      for (const item of initial) {
        await addDoc(ref, { ...item, createdAt: serverTimestamp() });
      }
      console.log('Babalawos seeded.');
    }
  },

  async seedVideos() {
    const ref = collection(db, 'videos');
    const q = await getDocs(ref);
    if (q.empty) {
      const initial = [
        { title: "Introduction to Ifa", description: "Learn the basics of Ifa philosophy.", youtubeId: "dQw4w9WgXcQ", requiredLevel: 0 },
        { title: "Sacred Herbs of Yoruba", description: "A guide to traditional healing plants.", youtubeId: "dQw4w9WgXcQ", requiredLevel: 1 }
      ];
      for (const item of initial) {
        await addDoc(ref, { ...item, createdAt: serverTimestamp() });
      }
      console.log('Videos seeded.');
    }
  },

  async seedCourses() {
    const ref = collection(db, 'courses');
    const q = await getDocs(ref);
    if (q.empty) {
      const initial = [
        { title: "Ifa Foundation", description: "The core principles of Ifa.", category: "General", price: 0, imageUrl: "https://picsum.photos/seed/course1/600/400" },
        { title: "Herbal Mastery", description: "Advanced herbal medicine techniques.", category: "Medicine", price: 15000, imageUrl: "https://picsum.photos/seed/course2/600/400" }
      ];
      for (const item of initial) {
        await addDoc(ref, { ...item, createdAt: serverTimestamp() });
      }
      console.log('Courses seeded.');
    }
  }
};
