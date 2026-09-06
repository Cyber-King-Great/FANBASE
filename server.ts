import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  serverDb,
  getCurrentCampaign,
  getOverviewStats,
  getCategories,
  getCategoryBySlug,
  getLeaderboard,
  getCountries,
  getCountryDetail,
  getArtistBySlug,
  getArticles,
  getArticleBySlug,
  getAdSlots,
  getSettings,
  DEFAULT_DISCLAIMER,
  submitVote,
  recordShare,
  recordNewsletter,
  recordAuditLog,
  getAdminAnalytics
} from './server/db.ts';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ----------------------------------------------------
  // PUBLIC API ROUTES
  // ----------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Settings & disclaimer
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await getSettings();
      res.json(settings);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Current active campaign
  app.get('/api/campaign/current', async (req, res) => {
    try {
      const campaign = await getCurrentCampaign();
      res.json(campaign);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Homepage real statistics overview
  app.get('/api/stats/overview', async (req, res) => {
    try {
      const stats = await getOverviewStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Categories list
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await getCategories();
      res.json(categories);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Category detail + ranked candidates by slug
  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const result = await getCategoryBySlug(req.params.slug);
      if (!result) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const data = await getLeaderboard(categoryId);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Countries
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await getCountries();
      res.json(countries);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Single country
  app.get('/api/country/:code', async (req, res) => {
    try {
      const country = await getCountryDetail(req.params.code);
      if (!country) return res.status(404).json({ error: 'Country not found' });
      res.json(country);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Artist by slug
  app.get('/api/artists/:slug', async (req, res) => {
    try {
      const artistData = await getArtistBySlug(req.params.slug);
      if (!artistData) return res.status(404).json({ error: 'Artist not found' });
      res.json(artistData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Articles
  app.get('/api/articles', async (req, res) => {
    try {
      const articles = await getArticles(true);
      res.json(articles);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/articles/:slug', async (req, res) => {
    try {
      const article = await getArticleBySlug(req.params.slug);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      res.json(article);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Ads
  app.get('/api/ads', async (req, res) => {
    try {
      const ads = await getAdSlots();
      res.json(ads);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Global Search
  app.get('/api/search', async (req, res) => {
    try {
      const queryStr = (req.query.q as string || '').toLowerCase().trim();
      if (!queryStr) {
        return res.json({ artists: [], candidates: [], categories: [], articles: [] });
      }

      // Fetch candidates, artists, categories, articles
      const [candsSnap, artistsSnap, catsSnap, artsSnap] = await Promise.all([
        getDocs(query(collection(serverDb, 'candidates'), where('status', '==', 'ACTIVE'))),
        getDocs(collection(serverDb, 'artists')),
        getDocs(query(collection(serverDb, 'categories'), where('status', '==', 'ACTIVE'))),
        getDocs(query(collection(serverDb, 'articles'), where('published', '==', true)))
      ]);

      const candidates = candsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((c) => c.title?.toLowerCase().includes(queryStr) || c.subtitle?.toLowerCase().includes(queryStr));

      const artists = artistsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((a) => a.name?.toLowerCase().includes(queryStr) || a.genres?.some((g: string) => g.toLowerCase().includes(queryStr)));

      const categories = catsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((cat) => cat.name?.toLowerCase().includes(queryStr) || cat.genre?.toLowerCase().includes(queryStr));

      const articles = artsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((art) => art.title?.toLowerCase().includes(queryStr) || art.excerpt?.toLowerCase().includes(queryStr));

      res.json({
        candidates: candidates.slice(0, 8),
        artists: artists.slice(0, 8),
        categories: categories.slice(0, 8),
        articles: articles.slice(0, 6)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // SUBMIT VOTE (ATOMIC FIRESTORE TRANSACTION + DUPLICATE PROTECTION)
  app.post('/api/votes', async (req, res) => {
    try {
      const { campaignId, categoryId, candidateId, userId, anonymousSessionId, country, countryCode } = req.body;

      if (!campaignId || !categoryId || !candidateId) {
        return res.status(400).json({ success: false, message: 'campaignId, categoryId, and candidateId are required.' });
      }

      if (!userId && !anonymousSessionId) {
        return res.status(400).json({ success: false, message: 'Voter session ID is required.' });
      }

      const voteResult = await submitVote({
        campaignId,
        categoryId,
        candidateId,
        userId,
        anonymousSessionId,
        country,
        countryCode
      });

      if (!voteResult.success) {
        return res.status(400).json(voteResult);
      }

      res.json(voteResult);
    } catch (e: any) {
      console.error('API /api/votes error:', e);
      res.status(500).json({ success: false, message: 'Voting is temporarily unavailable. Please try again shortly.' });
    }
  });

  // SHARE EVENT
  app.post('/api/share', async (req, res) => {
    try {
      const result = await recordShare(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false });
    }
  });

  // NEWSLETTER SIGNUP
  app.post('/api/newsletter', async (req, res) => {
    try {
      const { email, country, favoriteArtist } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Valid email required' });
      }
      const result = await recordNewsletter({ email, country, favoriteArtist });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Subscription failed' });
    }
  });

  // ----------------------------------------------------
  // ADMIN API ROUTES
  // ----------------------------------------------------

  // Admin Analytics
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const analytics = await getAdminAnalytics();
      res.json(analytics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Audit Logs
  app.get('/api/admin/audit-logs', async (req, res) => {
    try {
      const snap = await getDocs(query(collection(serverDb, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50)));
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Votes Viewer (Recent Votes)
  app.get('/api/admin/votes', async (req, res) => {
    try {
      const snap = await getDocs(query(collection(serverDb, 'votes'), orderBy('createdAt', 'desc'), limit(50)));
      const votes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json(votes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Category CRUD
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const catData = req.body;
      const catId = catData.id || catData.slug || `cat_${Date.now()}`;
      await setDoc(doc(serverDb, 'categories', catId), {
        ...catData,
        id: catId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'category_created', catId, catData);
      res.json({ success: true, id: catId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const catId = req.params.id;
      await updateDoc(doc(serverDb, 'categories', catId), {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'category_updated', catId, req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      const catId = req.params.id;
      await deleteDoc(doc(serverDb, 'categories', catId));
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'category_deleted', catId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Candidate CRUD
  app.post('/api/admin/candidates', async (req, res) => {
    try {
      const candData = req.body;
      const candId = candData.id || `cand_${Date.now()}`;
      await setDoc(doc(serverDb, 'candidates', candId), {
        ...candData,
        id: candId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // If categoryId was passed, create candidateCategory relationship
      if (candData.categoryId) {
        const relId = `${candData.categoryId}_${candId}`;
        await setDoc(doc(serverDb, 'candidateCategories', relId), {
          candidateId: candId,
          categoryId: candData.categoryId,
          campaignId: candData.campaignId || 'grammy-2027',
          eligibilityStatus: 'FAN_PREDICTION',
          submissionStatus: 'APPROVED',
          displayStatus: 'VISIBLE',
          displayOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'candidate_added', candId, candData);
      res.json({ success: true, id: candId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/candidates/:id', async (req, res) => {
    try {
      const candId = req.params.id;
      await updateDoc(doc(serverDb, 'candidates', candId), {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'candidate_updated', candId, req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Artist CRUD
  app.post('/api/admin/artists', async (req, res) => {
    try {
      const artistData = req.body;
      const artistId = artistData.id || artistData.slug || `artist_${Date.now()}`;
      await setDoc(doc(serverDb, 'artists', artistId), {
        ...artistData,
        id: artistId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'artist_created', artistId, artistData);
      res.json({ success: true, id: artistId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/artists/:id', async (req, res) => {
    try {
      const artistId = req.params.id;
      await updateDoc(doc(serverDb, 'artists', artistId), {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'artist_updated', artistId, req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Article CRUD
  app.post('/api/admin/articles', async (req, res) => {
    try {
      const artData = req.body;
      const artId = artData.id || artData.slug || `art_${Date.now()}`;
      await setDoc(doc(serverDb, 'articles', artId), {
        ...artData,
        id: artId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'article_published', artId, artData);
      res.json({ success: true, id: artId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/articles/:id', async (req, res) => {
    try {
      const artId = req.params.id;
      await updateDoc(doc(serverDb, 'articles', artId), {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'article_updated', artId, req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/articles/:id', async (req, res) => {
    try {
      const artId = req.params.id;
      await deleteDoc(doc(serverDb, 'articles', artId));
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'article_deleted', artId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Update Campaign Phase
  app.put('/api/admin/campaign/phase', async (req, res) => {
    try {
      const { campaignId, phase } = req.body;
      const cId = campaignId || 'grammy-2027';
      await setDoc(
        doc(serverDb, 'campaigns', cId),
        {
          currentPhase: phase,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'campaign_phase_changed', cId, { phase });
      res.json({ success: true, phase });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Update Settings (e.g. disclaimer)
  app.put('/api/admin/settings', async (req, res) => {
    try {
      const settings = req.body;
      await setDoc(doc(serverDb, 'settings', 'app'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await recordAuditLog(req.headers['x-admin-email'] as string || 'admin', 'settings_updated', 'app', settings);
      res.json({ success: true, settings });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Ads Management
  app.post('/api/admin/ads', async (req, res) => {
    try {
      const adData = req.body;
      const adId = adData.id || adData.placement || `ad_${Date.now()}`;
      await setDoc(doc(serverDb, 'adSlots', adId), {
        ...adData,
        id: adId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true, id: adId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/ads/:id', async (req, res) => {
    try {
      await updateDoc(doc(serverDb, 'adSlots', req.params.id), {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin: Explicit On-Demand Initialization of Official GRAMMY 2027 Award Categories
  // Note: Only writes categories & candidate fan predictions into Firestore, ZERO fake votes!
  app.post('/api/admin/init-categories', async (req, res) => {
    try {
      const adminEmail = (req.headers['x-admin-email'] as string) || 'admin';
      const campaignId = 'grammy-2027';

      // 1. Ensure Campaign doc exists
      await setDoc(doc(serverDb, 'campaigns', campaignId), {
        id: campaignId,
        name: 'GRAMMY 2027 Fan Predictions',
        slug: campaignId,
        description: 'Predict the artists, albums and songs you believe deserve recognition for the 2027 GRAMMYs.',
        eventName: 'GRAMMY Awards',
        eventYear: 2027,
        currentPhase: 'NOMINATION_PREDICTION',
        status: 'ACTIVE',
        brandingConfig: {
          tagline: 'Who deserves a GRAMMY nomination?'
        },
        disclaimer: DEFAULT_DISCLAIMER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Official 2027 General Field & Key Genre Categories
      const categoriesToInit = [
        {
          id: 'album-of-the-year',
          slug: 'album-of-the-year',
          name: 'Album of the Year',
          officialCategory: 'Album of the Year',
          genre: 'General Field',
          description: 'Awarded to the artist, featured artists, songwrites and producers of the album.',
          displayOrder: 1,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        },
        {
          id: 'record-of-the-year',
          slug: 'record-of-the-year',
          name: 'Record of the Year',
          officialCategory: 'Record of the Year',
          genre: 'General Field',
          description: 'Awarded to the performing artist, producer, recording engineer and/or mixer.',
          displayOrder: 2,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        },
        {
          id: 'song-of-the-year',
          slug: 'song-of-the-year',
          name: 'Song of the Year',
          officialCategory: 'Song of the Year',
          genre: 'General Field',
          description: 'A songwriter award recognizing excellence in song composition and lyrics.',
          displayOrder: 3,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        },
        {
          id: 'best-new-artist',
          slug: 'best-new-artist',
          name: 'Best New Artist',
          officialCategory: 'Best New Artist',
          genre: 'General Field',
          description: 'Recognizing a new artist who released during the eligibility year the first recording that establishes public identity.',
          displayOrder: 4,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        },
        {
          id: 'best-pop-solo-performance',
          slug: 'best-pop-solo-performance',
          name: 'Best Pop Solo Performance',
          officialCategory: 'Best Pop Solo Performance',
          genre: 'Pop',
          description: 'For new vocal or instrumental pop recordings with one performer.',
          displayOrder: 5,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        },
        {
          id: 'best-rap-album',
          slug: 'best-rap-album',
          name: 'Best Rap Album',
          officialCategory: 'Best Rap Album',
          genre: 'Rap / Hip-Hop',
          description: 'For albums containing at least 51% playing time of new rap recordings.',
          displayOrder: 6,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        },
        {
          id: 'best-rb-album',
          slug: 'best-rb-album',
          name: 'Best R&B Album',
          officialCategory: 'Best R&B Album',
          genre: 'R&B',
          description: 'For albums containing at least 51% playing time of new vocal or instrumental R&B recordings.',
          displayOrder: 7,
          status: 'ACTIVE',
          maxVotesPerUser: 1,
          phase: 'NOMINATION_PREDICTION'
        }
      ];

      for (const cat of categoriesToInit) {
        await setDoc(doc(serverDb, 'categories', cat.id), {
          ...cat,
          campaignId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Initial Fan Prediction Candidates
      const initialCandidates = [
        // Album of the Year candidates
        {
          id: 'cand-sabrina-short-sweet',
          type: 'ALBUM',
          title: 'Short n\' Sweet',
          subtitle: 'Sabrina Carpenter',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
          genre: 'Pop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Album of the Year.',
          status: 'ACTIVE',
          categoryIds: ['album-of-the-year']
        },
        {
          id: 'cand-chappell-rise-fall',
          type: 'ALBUM',
          title: 'The Rise and Fall of a Midwest Princess',
          subtitle: 'Chappell Roan',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
          genre: 'Pop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Album of the Year.',
          status: 'ACTIVE',
          categoryIds: ['album-of-the-year']
        },
        {
          id: 'cand-charli-brat',
          type: 'ALBUM',
          title: 'BRAT',
          subtitle: 'Charli xcx',
          imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80',
          genre: 'Electronic / Pop',
          country: 'United Kingdom',
          countryCode: 'GB',
          region: 'Europe',
          description: 'Fan Prediction Candidate for Album of the Year.',
          status: 'ACTIVE',
          categoryIds: ['album-of-the-year']
        },
        {
          id: 'cand-billie-hit-me-hard',
          type: 'ALBUM',
          title: 'HIT ME HARD AND SOFT',
          subtitle: 'Billie Eilish',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
          genre: 'Alternative / Pop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Album of the Year.',
          status: 'ACTIVE',
          categoryIds: ['album-of-the-year']
        },
        {
          id: 'cand-kendrick-not-like-us',
          type: 'SONG',
          title: 'Not Like Us',
          subtitle: 'Kendrick Lamar',
          imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
          genre: 'Hip-Hop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Record of the Year and Song of the Year.',
          status: 'ACTIVE',
          categoryIds: ['record-of-the-year', 'song-of-the-year']
        },
        {
          id: 'cand-sabrina-espresso',
          type: 'SONG',
          title: 'Espresso',
          subtitle: 'Sabrina Carpenter',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
          genre: 'Pop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Record of the Year and Pop Solo Performance.',
          status: 'ACTIVE',
          categoryIds: ['record-of-the-year', 'best-pop-solo-performance']
        },
        {
          id: 'cand-chappell-good-luck',
          type: 'SONG',
          title: 'Good Luck, Babe!',
          subtitle: 'Chappell Roan',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
          genre: 'Pop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Record of the Year and Song of the Year.',
          status: 'ACTIVE',
          categoryIds: ['record-of-the-year', 'song-of-the-year']
        },
        {
          id: 'cand-benson-boone',
          type: 'ARTIST',
          title: 'Benson Boone',
          subtitle: 'Beautiful Things',
          imageUrl: 'https://images.unsplash.com/photo-1520523839898-5071284cd0c1?w=500&auto=format&fit=crop&q=80',
          genre: 'Pop / Rock',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Best New Artist.',
          status: 'ACTIVE',
          categoryIds: ['best-new-artist']
        },
        {
          id: 'cand-chappell-roan-artist',
          type: 'ARTIST',
          title: 'Chappell Roan',
          subtitle: 'Pop Breakout',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
          genre: 'Pop',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Best New Artist.',
          status: 'ACTIVE',
          categoryIds: ['best-new-artist']
        },
        {
          id: 'cand-olivia-dean',
          type: 'ARTIST',
          title: 'Olivia Dean',
          subtitle: 'Messy / Dive',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
          genre: 'Soul / R&B',
          country: 'United Kingdom',
          countryCode: 'GB',
          region: 'Europe',
          description: 'Fan Prediction Candidate for Best New Artist.',
          status: 'ACTIVE',
          categoryIds: ['best-new-artist']
        },
        {
          id: 'cand-sza-saturn',
          type: 'SONG',
          title: 'Saturn',
          subtitle: 'SZA',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
          genre: 'R&B',
          country: 'United States',
          countryCode: 'US',
          region: 'North America',
          description: 'Fan Prediction Candidate for Best R&B Album / Performance.',
          status: 'ACTIVE',
          categoryIds: ['best-rb-album']
        }
      ];

      for (const cand of initialCandidates) {
        const { categoryIds, ...candData } = cand;
        await setDoc(doc(serverDb, 'candidates', cand.id), {
          ...candData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        for (let i = 0; i < categoryIds.length; i++) {
          const catId = categoryIds[i];
          const relId = `${catId}_${cand.id}`;
          await setDoc(doc(serverDb, 'candidateCategories', relId), {
            candidateId: cand.id,
            categoryId: catId,
            campaignId,
            eligibilityStatus: 'FAN_PREDICTION',
            submissionStatus: 'APPROVED',
            displayStatus: 'VISIBLE',
            displayOrder: i + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      await recordAuditLog(adminEmail, 'categories_and_candidates_initialized', campaignId, {
        categoriesCount: categoriesToInit.length,
        candidatesCount: initialCandidates.length
      });

      res.json({
        success: true,
        message: 'Official categories and candidates structure created successfully in Firestore.',
        categoriesCount: categoriesToInit.length,
        candidatesCount: initialCandidates.length
      });
    } catch (e: any) {
      console.error('Error in init-categories:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE / PRODUCTION STATIC SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fanbase server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
