import {ERRORS} from '@grnsft/if-core/utils';

import {Multiply} from '../../../if-run/builtins/multiply';

const {InputValidationError} = ERRORS;

describe('builtins/multiply: ', () => {
  describe('Multiply: ', () => {
    const config = {
      'input-parameters': ['cpu/energy', 'network/energy', 'memory/energy'],
      'output-parameter': 'energy',
    };
    const parametersMetadata = {
      inputs: {},
      outputs: {},
    };

    const multiply = Multiply(config, parametersMetadata, {});

    describe('init: ', () => {
      it('successfully initalized.', () => {
        expect(multiply).toHaveProperty('metadata');
        expect(multiply).toHaveProperty('execute');
      });
    });

    describe('execute(): ', () => {
      it('successfully applies Multiply strategy to given input.', async () => {
        expect.assertions(1);

        const expectedResult = [
          {
            duration: 3600,
            'cpu/energy': 2,
            'network/energy': 2,
            'memory/energy': 2,
            energy: 8,
            timestamp: '2021-01-01T00:00:00Z',
          },
        ];

        const result = await multiply.execute([
          {
            duration: 3600,
            'cpu/energy': 2,
            'network/energy': 2,
            'memory/energy': 2,
            timestamp: '2021-01-01T00:00:00Z',
          },
        ]);

        expect(result).toStrictEqual(expectedResult);
      });

      it('successfully executes when `mapping` is provided.', async () => {
        expect.assertions(1);
        const mapping = {
          'cpu/energy': 'energy-from-cpu',
          'network/energy': 'energy-from-network',
          'memory/energy': 'energy-from-memory',
        };
        const config = {
          'input-parameters': ['cpu/energy', 'network/energy', 'memory/energy'],
          'output-parameter': 'energy',
        };
        const multiply = Multiply(config, parametersMetadata, mapping);

        const expectedResult = [
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'energy-from-cpu': 2,
            'energy-from-network': 2,
            'energy-from-memory': 2,
            energy: 8,
          },
        ];

        const result = await multiply.execute([
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'energy-from-cpu': 2,
            'energy-from-network': 2,
            'energy-from-memory': 2,
          },
        ]);

        expect(result).toStrictEqual(expectedResult);
      });

      it('successfully executes when the `mapping` maps output parameter.', async () => {
        expect.assertions(1);
        const mapping = {
          energy: 'total/energy',
        };
        const config = {
          'input-parameters': ['cpu/energy', 'network/energy', 'memory/energy'],
          'output-parameter': 'energy',
        };
        const multiply = Multiply(config, parametersMetadata, mapping);

        const expectedResult = [
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'cpu/energy': 2,
            'network/energy': 2,
            'memory/energy': 2,
            'total/energy': 8,
          },
        ];

        const result = await multiply.execute([
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'cpu/energy': 2,
            'network/energy': 2,
            'memory/energy': 2,
          },
        ]);

        expect(result).toStrictEqual(expectedResult);
      });

      it('throws an error on missing params in input.', async () => {
        expect.assertions(1);

        try {
          await multiply.execute([
            {
              duration: 3600,
              timestamp: '2021-01-01T00:00:00Z',
            },
          ]);
        } catch (error) {
          expect(error).toStrictEqual(
            new InputValidationError(
              '"cpu/energy" parameter is required. Error code: invalid_type.,"network/energy" parameter is required. Error code: invalid_type.,"memory/energy" parameter is required. Error code: invalid_type.'
            )
          );
        }
      });

      it('returns a result with input params not related to energy.', async () => {
        expect.assertions(1);
        const newConfig = {
          'input-parameters': ['carbon', 'other-carbon'],
          'output-parameter': 'carbon-product',
        };
        const multiply = Multiply(newConfig, parametersMetadata, {});

        const data = [
          {
            duration: 3600,
            timestamp: '2021-01-01T00:00:00Z',
            carbon: 3,
            'other-carbon': 2,
          },
        ];
        const response = await multiply.execute(data);

        const expectedResult = [
          {
            duration: 3600,
            timestamp: '2021-01-01T00:00:00Z',
            carbon: 3,
            'other-carbon': 2,
            'carbon-product': 6,
          },
        ];

        expect(response).toEqual(expectedResult);
      });
    });
  });
});
