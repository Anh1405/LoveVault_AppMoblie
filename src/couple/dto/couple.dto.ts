import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ConnectCodeDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã ghép đôi không được bỏ trống.' })
  @Length(6, 6, { message: 'Mã ghép đôi phải đúng 6 ký tự.' })
  pairingCode!: string;
}