import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, Campaign, Candidate, Article, AdSlot, CountryStat } from '../types';

export const DEFAULT_DISCLAIMER =
  'GRAMMY® is a trademark of The Recording Academy. This website is an independent fan prediction platform and is not affiliated with, sponsored by, or endorsed by The Recording Academy.';

function formatDoc<T = any>(d: any): T {
  return { id: d.id, ...d.data() } as T;
}

// ----------------------------------------------------
// Public API wrappers with automatic Firestore fallback
// ----------------------------------------------------

export async function fetchOverviewStats() {
  try {
    const res = await fetch('/api/stats/overview');
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const campaign = await fetchCurrentCampaign();
    const campaignId = campaign.id || 'grammy-2027';

    let totalVotes = 0;
    let totalCategories = 0;
    let totalCandidates = 0;
    let countriesCount = 0;

    const statsDoc = await getDoc(doc(db, 'campaignStats', campaignId));
    if (statsDoc.exists()) {
      totalVotes = statsDoc.data().totalVotes || 0;
    }

    const catSnap = await getDocs(query(collection(db, 'categories'), where('status', '==', 'ACTIVE')));
    totalCategories = catSnap.size;

    const candSnap = await getDocs(query(collection(db, 'candidates'), where('status', '==', 'ACTIVE')));
    totalCandidates = candSnap.size;

    const countrySnap = await getDocs(collection(db, 'countryStats'));
    countriesCount = countrySnap.size;

    return {
      campaign,
      totalVotes,
      totalCategories,
      totalCandidates,
      countriesCount
    };
  } catch (err) {
    console.error('Error fetching overview stats from Firestore:', err);
    return {
      totalVotes: 0,
      totalCategories: 0,
      totalCandidates: 0,
      countriesCount: 0
    };
  }
}

export async function fetchCurrentCampaign(): Promise<Campaign> {
  try {
    const res = await fetch('/api/campaign/current');
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, where('status', '==', 'ACTIVE'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return formatDoc<Campaign>(snap.docs[0]);
    }
  } catch (err) {
    console.error('Error fetching campaign from Firestore:', err);
  }

  return {
    id: 'grammy-2027',
    name: 'GRAMMY 2027 Fan Predictions',
    slug: 'grammy-2027',
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
  };
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'categories'), where('status', '==', 'ACTIVE'), orderBy('displayOrder', 'asc'))
    );
    const categories = snap.docs.map((d) => formatDoc<Category>(d));

    const catStatsSnap = await getDocs(collection(db, 'categoryStats'));
    const statsMap = new Map();
    catStatsSnap.forEach((d) => statsMap.set(d.id, d.data()));

    return categories.map((cat: any) => {
      const stat = statsMap.get(cat.id) || { totalVotes: 0 };
      return {
        ...cat,
        totalVotes: stat.totalVotes || 0,
        leadingCandidateId: stat.leadingCandidateId || null,
        leadingCandidateName: stat.leadingCandidateName || null,
        leadingPercentage: stat.leadingPercentage || 0
      };
    });
  } catch (err) {
    console.error('Error fetching categories from Firestore:', err);
    return [];
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<{ category: Category; candidates: any[] } | null> {
  try {
    const res = await fetch(`/api/categories/${slug}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const snap = await getDocs(query(collection(db, 'categories'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    const category: any = formatDoc(snap.docs[0]);

    const ccSnap = await getDocs(
      query(
        collection(db, 'candidateCategories'),
        where('categoryId', '==', category.id),
        where('displayStatus', '==', 'VISIBLE'),
        orderBy('displayOrder', 'asc')
      )
    );

    const candidateIds = ccSnap.docs.map((d) => d.data().candidateId);
    let candidates: any[] = [];

    if (candidateIds.length > 0) {
      const candPromises = candidateIds.map((cid) => getDoc(doc(db, 'candidates', cid)));
      const candDocs = await Promise.all(candPromises);
      candidates = candDocs.filter((d) => d.exists()).map((d) => formatDoc(d));
    }

    const catStatDoc = await getDoc(doc(db, 'categoryStats', category.id));
    const catTotalVotes = catStatDoc.exists() ? catStatDoc.data().totalVotes || 0 : 0;

    const statsWithCandidate = await Promise.all(
      candidates.map(async (cand) => {
        const statKey = `${category.id}_${cand.id}`;
        const sDoc = await getDoc(doc(db, 'candidateStats', statKey));
        const votes = sDoc.exists() ? sDoc.data().votes || 0 : 0;
        const percentage = catTotalVotes > 0 ? Math.round((votes / catTotalVotes) * 100) : 0;
        return {
          ...cand,
          votes,
          percentage
        };
      })
    );

    statsWithCandidate.sort((a, b) => b.votes - a.votes);
    const rankedCandidates = statsWithCandidate.map((c, idx) => ({
      ...c,
      rank: idx + 1
    }));

    return {
      category: {
        ...category,
        totalVotes: catTotalVotes
      },
      candidates: rankedCandidates
    };
  } catch (err) {
    console.error('Error fetching category by slug from Firestore:', err);
    return null;
  }
}

export async function fetchLeaderboard(categoryId?: string): Promise<any[]> {
  try {
    const url = categoryId ? `/api/leaderboard?categoryId=${encodeURIComponent(categoryId)}` : '/api/leaderboard';
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    if (categoryId) {
      const catDoc = await getDoc(doc(db, 'categories', categoryId));
      if (!catDoc.exists()) return [];
      const catData: any = formatDoc(catDoc);
      const res = await fetchCategoryBySlug(catData.slug);
      return res ? res.candidates : [];
    }

    const allCandsSnap = await getDocs(query(collection(db, 'candidates'), where('status', '==', 'ACTIVE')));
    const candidates = allCandsSnap.docs.map((d) => formatDoc(d));

    const statsSnap = await getDocs(collection(db, 'candidateStats'));
    const voteSumMap = new Map<string, number>();
    statsSnap.forEach((d) => {
      const data = d.data();
      const cId = data.candidateId;
      const count = data.votes || 0;
      if (cId) {
        voteSumMap.set(cId, (voteSumMap.get(cId) || 0) + count);
      }
    });

    let totalGlobalVotes = 0;
    const ranked = candidates.map((cand: any) => {
      const votes = voteSumMap.get(cand.id) || 0;
      totalGlobalVotes += votes;
      return {
        ...cand,
        votes
      };
    });

    ranked.sort((a, b) => b.votes - a.votes);
    return ranked.map((c, idx) => ({
      ...c,
      percentage: totalGlobalVotes > 0 ? Math.round((c.votes / totalGlobalVotes) * 100) : 0,
      rank: idx + 1
    }));
  } catch (err) {
    console.error('Error fetching leaderboard from Firestore:', err);
    return [];
  }
}

export async function fetchCountries(): Promise<CountryStat[]> {
  try {
    const res = await fetch('/api/countries');
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const snap = await getDocs(query(collection(db, 'countryStats'), orderBy('totalVotes', 'desc')));
    return snap.docs.map((d) => formatDoc<CountryStat>(d));
  } catch (err) {
    console.error('Error fetching country stats from Firestore:', err);
    return [];
  }
}

export async function fetchArticles(): Promise<Article[]> {
  try {
    const res = await fetch('/api/articles');
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const q = query(collection(db, 'articles'), where('published', '==', true), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => formatDoc<Article>(d));
  } catch (err) {
    console.error('Error fetching articles from Firestore:', err);
    return [];
  }
}

export async function fetchAdSlots(): Promise<AdSlot[]> {
  try {
    const res = await fetch('/api/ads');
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const snap = await getDocs(collection(db, 'adSlots'));
    return snap.docs.map((d) => formatDoc<AdSlot>(d));
  } catch (err) {
    console.error('Error fetching ad slots from Firestore:', err);
    return [];
  }
}

export async function searchGlobal(queryStr: string) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(queryStr)}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  const qStr = queryStr.toLowerCase().trim();
  if (!qStr) return { candidates: [], artists: [], categories: [], articles: [] };

  try {
    const [candsSnap, artistsSnap, catsSnap, artsSnap] = await Promise.all([
      getDocs(query(collection(db, 'candidates'), where('status', '==', 'ACTIVE'))),
      getDocs(collection(db, 'artists')),
      getDocs(query(collection(db, 'categories'), where('status', '==', 'ACTIVE'))),
      getDocs(query(collection(db, 'articles'), where('published', '==', true)))
    ]);

    const candidates = candsSnap.docs
      .map((d) => formatDoc(d))
      .filter((c: any) => c.title?.toLowerCase().includes(qStr) || c.subtitle?.toLowerCase().includes(qStr));

    const artists = artistsSnap.docs
      .map((d) => formatDoc(d))
      .filter((a: any) => a.name?.toLowerCase().includes(qStr) || a.genres?.some((g: string) => g.toLowerCase().includes(qStr)));

    const categories = catsSnap.docs
      .map((d) => formatDoc(d))
      .filter((cat: any) => cat.name?.toLowerCase().includes(qStr) || cat.genre?.toLowerCase().includes(qStr));

    const articles = artsSnap.docs
      .map((d) => formatDoc(d))
      .filter((art: any) => art.title?.toLowerCase().includes(qStr) || art.excerpt?.toLowerCase().includes(qStr));

    return {
      candidates: candidates.slice(0, 8),
      artists: artists.slice(0, 8),
      categories: categories.slice(0, 8),
      articles: articles.slice(0, 6)
    };
  } catch (err) {
    console.error('Error during global search in Firestore:', err);
    return { candidates: [], artists: [], categories: [], articles: [] };
  }
}

export async function postVote(payload: {
  campaignId: string;
  categoryId: string;
  candidateId: string;
  userId?: string;
  anonymousSessionId?: string;
  country?: string;
  countryCode?: string;
}) {
  // First attempt backend API if available
  try {
    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      return await response.json();
    }
    const errData = await response.json().catch(() => null);
    if (errData && errData.error === 'DUPLICATE_VOTE') {
      return errData;
    }
  } catch {
    // fallback to direct Firestore transaction
  }

  const { campaignId, categoryId, candidateId, userId, anonymousSessionId } = payload;
  const voterKey = userId ? `user_${userId}` : anonymousSessionId ? `anon_${anonymousSessionId}` : null;

  if (!campaignId || !categoryId || !candidateId || !voterKey) {
    return { success: false, error: 'INVALID_INPUT', message: 'Missing voting parameters.' };
  }

  const countryCode = (payload.countryCode || 'US').toUpperCase();
  const country = payload.country || 'United States';
  const duplicateId = `${campaignId}_${categoryId}_${voterKey}`;
  const voteDocRef = doc(db, 'votes', duplicateId);

  const campaignStatRef = doc(db, 'campaignStats', campaignId);
  const categoryStatRef = doc(db, 'categoryStats', categoryId);
  const statKey = `${categoryId}_${candidateId}`;
  const candidateStatRef = doc(db, 'candidateStats', statKey);
  const countryStatRef = doc(db, 'countryStats', countryCode);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const existingVote = await transaction.get(voteDocRef);
      if (existingVote.exists()) {
        throw new Error('DUPLICATE_VOTE');
      }

      const catDocRef = doc(db, 'categories', categoryId);
      const catSnap = await transaction.get(catDocRef);
      if (!catSnap.exists() || catSnap.data().status !== 'ACTIVE') {
        throw new Error('CATEGORY_INACTIVE');
      }

      const candDocRef = doc(db, 'candidates', candidateId);
      const candSnap = await transaction.get(candDocRef);
      if (!candSnap.exists() || candSnap.data().status !== 'ACTIVE') {
        throw new Error('CANDIDATE_INACTIVE');
      }

      transaction.set(voteDocRef, {
        campaignId,
        categoryId,
        candidateId,
        userId: userId || null,
        anonymousSessionId: anonymousSessionId || null,
        voterKey,
        country,
        countryCode,
        status: 'VALID',
        riskScore: 0,
        createdAt: new Date().toISOString()
      });

      transaction.set(
        campaignStatRef,
        {
          campaignId,
          totalVotes: increment(1),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      transaction.set(
        categoryStatRef,
        {
          categoryId,
          campaignId,
          totalVotes: increment(1),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      transaction.set(
        candidateStatRef,
        {
          candidateId,
          categoryId,
          campaignId,
          votes: increment(1),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      transaction.set(
        countryStatRef,
        {
          countryCode,
          countryName: country,
          totalVotes: increment(1),
          topCandidateName: candSnap.data().title || candSnap.data().subtitle,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      return {
        candidateName: candSnap.data().title,
        categoryName: catSnap.data().name
      };
    });

    return {
      success: true,
      voteId: duplicateId,
      message: `Vote recorded for ${result.candidateName}!`,
      candidateName: result.candidateName,
      categoryName: result.categoryName
    };
  } catch (err: any) {
    if (err.message === 'DUPLICATE_VOTE') {
      return {
        success: false,
        error: 'DUPLICATE_VOTE',
        message: 'You have already submitted your prediction for this category.'
      };
    }
    console.error('Error submitting vote to Firestore:', err);
    return {
      success: false,
      error: 'VOTE_ERROR',
      message: 'Voting is temporarily unavailable. Please try again.'
    };
  }
}

export async function postShare(payload: any) {
  try {
    await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // fallback to direct Firestore
    try {
      const sCol = collection(db, 'shareEvents');
      await setDoc(doc(sCol), {
        ...payload,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error recording share in Firestore:', e);
    }
  }
}

export async function postNewsletter(payload: { email: string; country?: string; favoriteArtist?: string }) {
  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback to direct Firestore
  }

  try {
    const emailKey = payload.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await setDoc(
      doc(db, 'newsletterSubscribers', emailKey),
      {
        email: payload.email,
        country: payload.country || 'Unknown',
        favoriteArtist: payload.favoriteArtist || '',
        consent: true,
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );
    return { success: true, message: 'Subscribed successfully!' };
  } catch (e) {
    console.error('Error saving newsletter subscriber:', e);
    return { success: false, message: 'Subscription failed. Please try again.' };
  }
}

export async function fetchAdminAnalytics(adminEmail: string) {
  try {
    const res = await fetch('/api/admin/analytics', { headers: { 'x-admin-email': adminEmail } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  try {
    const [votesSnap, suspSnap, articlesSnap, countriesSnap, catsSnap, candsSnap] = await Promise.all([
      getDocs(collection(db, 'votes')),
      getDocs(collection(db, 'suspiciousVotes')),
      getDocs(collection(db, 'articles')),
      getDocs(collection(db, 'countryStats')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'candidates'))
    ]);

    const totalVotes = votesSnap.size;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let votesToday = 0;
    let votesThisWeek = 0;

    votesSnap.forEach((d) => {
      const data = d.data();
      if (data.createdAt) {
        const vDate = new Date(data.createdAt);
        if (vDate >= oneDayAgo) votesToday++;
        if (vDate >= oneWeekAgo) votesThisWeek++;
      }
    });

    return {
      totalVotes,
      votesToday,
      votesThisWeek,
      suspiciousCount: suspSnap.size,
      totalUsers: 0,
      totalArticles: articlesSnap.size,
      totalCountries: countriesSnap.size,
      totalCategories: catsSnap.size,
      totalCandidates: candsSnap.size
    };
  } catch (err) {
    console.error('Error fetching admin analytics from Firestore:', err);
    return {
      totalVotes: 0,
      votesToday: 0,
      votesThisWeek: 0,
      suspiciousCount: 0,
      totalUsers: 0,
      totalArticles: 0,
      totalCountries: 0,
      totalCategories: 0,
      totalCandidates: 0
    };
  }
}
