export type CampaignPhase = 'NOMINATION_PREDICTION' | 'WINNER_PREDICTION' | 'RESULTS';

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  eventName: string;
  eventYear: number;
  startDate?: string;
  endDate?: string;
  currentPhase: CampaignPhase;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  brandingConfig?: {
    accentColor?: string;
    tagline?: string;
  };
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  campaignId: string;
  name: string;
  slug: string;
  description: string;
  officialCategory: string;
  genre: string;
  region?: string;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  votingStart?: string;
  votingEnd?: string;
  maxVotesPerUser: number;
  phase: CampaignPhase;
  officialNomineesAnnounced?: boolean;
  officialWinnerCandidateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  region: string;
  genres: string[];
  biography: string;
  imageUrl: string;
  heroImageUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  artistId: string;
  artistName?: string;
  title: string;
  slug: string;
  releaseDate: string;
  coverImage: string;
  description: string;
  spotifyUrl?: string;
  appleUrl?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  id: string;
  artistId: string;
  artistName?: string;
  albumId?: string;
  title: string;
  slug: string;
  releaseDate: string;
  artwork: string;
  spotifyUrl?: string;
  appleUrl?: string;
  youtubeUrl?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export type CandidateType = 'ARTIST' | 'SONG' | 'ALBUM' | 'COLLABORATION';

export interface Candidate {
  id: string;
  type: CandidateType;
  artistId?: string;
  artistName?: string;
  songId?: string;
  albumId?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  country: string;
  countryCode: string;
  region: string;
  genre: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  isOfficialNominee?: boolean;
  isOfficialWinner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateCategory {
  id: string;
  candidateId: string;
  categoryId: string;
  campaignId: string;
  eligibilityStatus: 'FAN_PREDICTION' | 'CONFIRMED' | 'WITHDRAWN';
  submissionStatus: 'SUBMITTED' | 'APPROVED';
  displayStatus: 'VISIBLE' | 'HIDDEN';
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type VoteStatus = 'VALID' | 'REVIEW' | 'REJECTED';

export interface Vote {
  id: string;
  campaignId: string;
  categoryId: string;
  candidateId: string;
  userId?: string;
  anonymousSessionId?: string;
  country: string;
  countryCode: string;
  status: VoteStatus;
  riskScore: number;
  createdAt: string;
}

export interface CandidateStat {
  candidateId: string;
  categoryId: string;
  votes: number;
  percentage: number;
  rank: number;
  candidate?: Candidate;
}

export interface CategoryStats {
  categoryId: string;
  campaignId: string;
  totalVotes: number;
  leadingCandidateId?: string;
  leadingPercentage?: number;
  candidatesCount: number;
  updatedAt: string;
}

export interface CampaignStats {
  campaignId: string;
  totalVotes: number;
  totalVoters: number;
  totalCategories: number;
  totalCandidates: number;
  updatedAt: string;
}

export interface CountryStat {
  countryCode: string;
  countryName: string;
  totalVotes: number;
  topCandidateName?: string;
  topArtistId?: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImage: string;
  author: string;
  category: string;
  published: boolean;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdSlot {
  id: string;
  name: string;
  placement: string;
  device: 'all' | 'mobile' | 'desktop';
  provider: 'adsense' | 'sponsor' | 'affiliate';
  code: string;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  country?: string;
  favoriteArtist?: string;
  favoriteCategory?: string;
  consent: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface AppSettings {
  disclaimer: string;
  allowAnonymousVoting: boolean;
  siteTitle: string;
  contactEmail: string;
  updatedAt: string;
}
