import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { getRepository } from 'typeorm';
import { User } from 'src/modules/entity/user.entity';
import { data } from '../../seeders/header/data';

/**
 * Check if user already registerd validator
 */
@ValidatorConstraint()
export class IsUserAlreadyExist implements ValidatorConstraintInterface {
  async validate(email: string, args: ValidationArguments) {
    console.log(args);
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { email: email } });

    if (user) {
      return false;

    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    console.log(args);
    // here you can provide default error message if validation failed
    return `Another account is using ${args.value}`;
  }
}

@ValidatorConstraint()
export class IsUserAlreadyPhoneNumber implements ValidatorConstraintInterface {
  async validate(phone: string, args: ValidationArguments) {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { phone: phone } });

    if (user) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Another account is registered to ${args.value}`;
  }
}
