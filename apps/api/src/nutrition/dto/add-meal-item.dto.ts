import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class AddMealItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  foodId?: string;

  @ApiPropertyOptional({ example: "Custom protein bar" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customFoodName?: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(1)
  quantityGrams!: number;
}
