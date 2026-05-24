import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';
import { LANGUAGES } from '../config';

export function IsSupportedLanguage(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsSupportedLanguage',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === 'string' && !!LANGUAGES[value];
                },
                defaultMessage(args: ValidationArguments) {
                    return `unsupported language: ${args.value}. Supported: ${Object.keys(
                        LANGUAGES,
                    ).join(', ')}`;
                },
            },
        });
    };
}