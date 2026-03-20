import { PartialType, OmitType } from "@nestjs/swagger";
import { AddExerciseDto } from "./add-exercise.dto";

export class UpdateDayExerciseDto extends PartialType(
  OmitType(AddExerciseDto, ["exerciseId"]),
) {}
