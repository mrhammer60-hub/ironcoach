import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min } from "class-validator";

export class UpdateMealItemDto {
  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(1)
  quantityGrams!: number;
}
