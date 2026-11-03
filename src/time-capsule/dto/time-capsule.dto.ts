import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTimeCapsuleDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung thư không được bỏ trống.' })
  content!: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsDateString({}, { message: 'Thời gian mở thư phải đúng định dạng ISO Date.' })
  unlockAt!: string;
}