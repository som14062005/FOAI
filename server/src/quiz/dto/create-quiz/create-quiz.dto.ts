
// src/quiz/dto/create-quiz.dto.ts
export class CreateQuizDto {
  username: string;
  foodPreference: string;
  preferredActivity: string;
  accommodationType: string;
  travelPace: string;
  travelCompanion: string;
  travelInterests: string[];
  preferredDestination?: string;
  budget?: string;
  tripDuration?: string;
  transportPreference?: string;
  season?: string;
}
