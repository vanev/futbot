import Timestamp from "./Timestamp";

type Scoreboard = {
  leagues: Array<{
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    midsizeName: string;
    slug: string;
    season: {
      year: number;
      startDate: Timestamp;
      endDate: Timestamp;
      type: {
        id: string;
        type: number;
        name: string;
        abbreviation: string;
      };
    };
    logos: Array<{
      href: string;
      width: number;
      height: number;
      alt: string;
      rel: Array<string>;
      lastUpdated: Timestamp;
    }>;
    calendarType: string;
    calendarIsWhitelist: boolean;
    calendarStartDate: Timestamp;
    calendarEndDate: Timestamp;
    calendar: Array<{
      label: string;
      startDate: Timestamp;
      endDate: Timestamp;
      entries: Array<{
        label: string;
        detail: string;
        value: string;
        startDate: Timestamp;
        endDate: Timestamp;
      }>;
    }>;
  }>;
  events: Array<{
    id: string;
    uid: string;
    date: string;
    name: string;
    shortName: string;
    season: {
      year: number;
      type: number;
      slug: string;
    };
    competitions: Array<{
      id: string;
      uid: string;
      date: Timestamp;
      startDate: Timestamp;
      attendance: number;
      timeValid: boolean;
      recent: boolean;
      status: {
        clock: number;
        displayClock: string;
        period: number;
        type: {
          id: string;
          name: string;
          state: string;
          completed: boolean;
          description: string;
          detail: string;
          shortDetail: string;
        };
      };
      venue: {
        id: string;
        fullName: string;
        address: {
          city: string;
          country: string;
        };
      };
      format: {
        regulation: {
          periods: number;
        };
      };
      notes: Array<unknown>;
      geoBroadcasts: Array<{
        type: {
          id: string;
          shortName: string;
        };
        market: {
          id: string;
          type: string;
        };
        media: {
          shortName: string;
        };
        lang: string;
        region: string;
      }>;
      broadcasts: Array<{
        market: string;
        names: Array<string>;
      }>;
      competitors: Array<{
        id: string;
        uid: string;
        type: string;
        order: number;
        homeAway: "home" | "away";
        winner: boolean;
        advance: boolean;
        form: string;
        score: string;
        records: Array<{
          name: string;
          type: string;
          summary: string;
          abbreviation: string;
        }>;
        team: {
          id: string;
          uid: string;
          abbreviation: string;
          displayName: string;
          shortDisplayName: string;
          name: string;
          location: string;
          color: string;
          alternateColor: string;
          isActive: boolean;
          logo: string;
          links: Array<{
            rel: Array<string>;
            href: string;
            text: string;
            isExternal: boolean;
            isPremium: boolean;
          }>;
          venue: {
            id: string;
          };
        };
        statistics: Array<{
          name: string;
          abbreviation: string;
          displayValue: string;
        }>;
      }>;
      details: Array<{
        type: {
          id: string;
          text: string;
        };
        clock: {
          value: number;
          displayValue: string;
        };
        team: {
          id: string;
        };
        scoreValue: number;
        scoringPlay: boolean;
        redCard: boolean;
        yellowCard: boolean;
        penaltyKick: boolean;
        ownGoal: boolean;
        shootout: boolean;
        athletesInvolved: Array<unknown>;
        headlines: Array<{
          description: string;
          type: string;
          shortLinkText: string;
        }>;
      }>;
    }>;
    status: unknown;
    links: Array<unknown>;
  }>;
};

export default Scoreboard;
