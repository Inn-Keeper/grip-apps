export type ProfileForm = {
  displayName: string;
  headline: string;
  targetRole: string;
  location: string;
  timezone: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  [key: string]: string;
};

export type ProfileRecord = {
  displayName?: string;
  email?: string;
  xp?: number;
  githubUrl?: string;
  useGithubTechsForPrep?: boolean;
  cvTechs?: string[];
  favoriteTechs?: string[];
};

export type Rank = { name: string; min: number };
