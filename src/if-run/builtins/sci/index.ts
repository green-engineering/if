import {z} from 'zod';
import {ERRORS} from '@grnsft/if-core/utils';
import {
  mapInputIfNeeded,
  mapOutputIfNeeded,
} from '@grnsft/if-core/utils/helpers';
import {
  ExecutePlugin,
  PluginParams,
  ConfigParams,
  PluginParametersMetadata,
  ParameterMetadata,
  MappingParams,
} from '@grnsft/if-core/types';

import {validate, allDefined} from '../../../common/util/validations';

import {STRINGS} from '../../config';

const {ConfigError} = ERRORS;
const {MISSING_CONFIG} = STRINGS;

const {MissingInputDataError} = ERRORS;
const {
  MISSING_FUNCTIONAL_UNIT_CONFIG,
  MISSING_FUNCTIONAL_UNIT_INPUT,
  SCI_MISSING_FN_UNIT,
  ZERO_DIVISION,
} = STRINGS;

export const Sci = (
  config: ConfigParams,
  parametersMetadata: PluginParametersMetadata,
  mapping: MappingParams
): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
    inputs: {
      ...({
        carbon: {
          description: 'an amount of carbon emitted into the atmosphere',
          unit: 'gCO2e',
          'aggregation-method': {
            time: 'sum',
            component: 'sum',
          },
        },
        'functional-unit': {
          description:
            'the name of the functional unit in which the final SCI value should be expressed, e.g. requests, users',
          unit: 'none',
          'aggregation-method': {
            time: 'sum',
            component: 'sum',
          },
        },
      } as ParameterMetadata),
      ...parametersMetadata?.inputs,
    },
    outputs: parametersMetadata?.outputs || {
      sci: {
        description: 'carbon expressed in terms of the given functional unit',
        unit: 'gCO2e',
        'aggregation-method': {
          time: 'avg',
          component: 'sum',
        },
      },
    },
  };

  /**
   * Validates config.
   */
  const validateConfig = () => {
    if (!config) {
      throw new ConfigError(MISSING_CONFIG);
    }

    const schema = z
      .object({
        'functional-unit': z.string(),
      })
      .refine(data => data['functional-unit'], {
        message: MISSING_FUNCTIONAL_UNIT_CONFIG,
      });

    return validate<z.infer<typeof schema>>(schema, config);
  };

  /**
   * Calculate the total emissions for a list of inputs.
   */
  const execute = (inputs: PluginParams[]): PluginParams[] => {
    return inputs.map((input, index) => {
      const mappedInput = mapInputIfNeeded(input, mapping);
      const safeInput = validateInput(mappedInput);
      const functionalUnit = input[config['functional-unit']];

      if (functionalUnit === 0) {
        console.warn(ZERO_DIVISION(Sci.name, index));

        return {
          ...input,
          sci: safeInput['carbon'],
        };
      }

      const result = {
        ...input,
        sci: safeInput['carbon'] / functionalUnit,
      };

      return mapOutputIfNeeded(result, mapping);
    });
  };
  /**
   * Checks for fields in input.
   */
  const validateInput = (input: PluginParams) => {
    const validatedConfig = validateConfig();

    if (
      !(
        validatedConfig['functional-unit'] in input &&
        input[validatedConfig['functional-unit']] >= 0
      )
    ) {
      throw new MissingInputDataError(MISSING_FUNCTIONAL_UNIT_INPUT);
    }

    const schema = z
      .object({
        carbon: z.number().gte(0),
        duration: z.number().gte(1),
      })
      .refine(allDefined, {
        message: SCI_MISSING_FN_UNIT(config['functional-unit']),
      });

    return validate<z.infer<typeof schema>>(schema, input);
  };

  return {
    metadata,
    execute,
  };
};
