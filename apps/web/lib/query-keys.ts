export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  coach: {
    dashboard: () => ["coach", "dashboard"] as const,
    trainees: (filters?: object) => ["coach", "trainees", filters] as const,
    trainee: (id: string) => ["coach", "trainees", id] as const,
  },
  org: {
    me: () => ["org", "me"] as const,
    members: () => ["org", "members"] as const,
  },
  billing: {
    subscription: () => ["billing", "subscription"] as const,
  },
  workouts: {
    programs: () => ["workouts", "programs"] as const,
    program: (id: string) => ["workouts", "programs", id] as const,
    today: () => ["workouts", "today"] as const,
    exercises: (filters?: object) => ["workouts", "exercises", filters] as const,
  },
  nutrition: {
    plans: () => ["nutrition", "plans"] as const,
    today: () => ["nutrition", "today"] as const,
  },
  progress: {
    checkins: () => ["progress", "checkins"] as const,
    traineeProgress: (id: string) => ["progress", "trainee", id] as const,
  },
  chat: {
    conversations: () => ["chat", "conversations"] as const,
    messages: (convoId: string) => ["chat", "messages", convoId] as const,
  },
};
