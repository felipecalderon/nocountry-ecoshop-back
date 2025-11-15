import { Controller } from '@nestjs/common';
import { CertificationsService } from './certifications.service';

@Controller('certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}
}
