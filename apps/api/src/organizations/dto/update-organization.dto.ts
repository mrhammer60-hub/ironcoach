import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from "class-validator";

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: "Ahmed Fitness Studio" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: "ahmed-fitness", pattern: "^[a-z0-9-]{3,32}$" })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,32}$/, {
    message: "Slug must be 3-32 characters, lowercase alphanumeric and hyphens only",
  })
  slug?: string;

  @ApiPropertyOptional({ example: "ahmed-fitness", pattern: "^[a-z0-9-]{3,32}$" })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,32}$/, {
    message: "Subdomain must be 3-32 characters, lowercase alphanumeric and hyphens only",
  })
  subdomain?: string;

  @ApiPropertyOptional({ example: "#FF5722" })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "Brand color must be a valid hex color" })
  brandColor?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/logo.png" })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
