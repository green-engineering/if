import * as fs from 'fs';
import {expect, jest, it} from '@jest/globals';

import {openYamlFileAsObject} from '../../../util/yaml';
import {describe} from 'node:test';

jest.setTimeout(30000);

describe('ompls: ', () => {
  const path = 'examples/ompls';
  const files = fs.readdirSync(path);
  /*
   * If there are no files in examples/ompls, prompt user to run ompl-test bash script
   */
  if (files.length === 0) {
    throw 'no ompl files available. Please run scripts/rimpl-test.sh before running these tests.';
  }

  describe('computing(): ', () => {
    /*
     * For each file in examples/ompls, load it and run test
     */
    files.forEach(file => {
      if (file.includes('nesting')) {
        it('check nested ompls have impacts field', async () => {
          expect.assertions(2);
          const ompl = await openYamlFileAsObject(path + '/' + file);
          const expectedProperty = 'impacts';

          expect(
            ompl['graph']['children']['child']['children']['child-1']
          ).toHaveProperty(expectedProperty);
          expect(
            ompl['graph']['children']['child']['children']['child-2']
          ).toHaveProperty(expectedProperty);
        });
      } else {
        console.log('condition: false, file = ', file);
        it('check ompls have impacts field', async () => {
          expect.assertions(1);

          const ompl = await openYamlFileAsObject(path + '/' + file);
          const expectedProperty = 'impacts';

          expect(ompl['graph']['children']['child']).toHaveProperty(
            expectedProperty
          );
        });
      }

      if (file.includes('sci-m')) {
        it('checks `sci-m` ompl to have impacts property.', async () => {
          const ompl = await openYamlFileAsObject(`${path}/${file}`);

          const impactData = JSON.stringify(
            ompl['graph']['children']['child']['impacts']
          );
          const response = impactData.includes('m');

          expect(response).toBeTruthy();
        });
      }

      if (file.includes('complex-pipeline')) {
        it('checks `complex-pipeline` to have `energy-memory`, `energy-cpu`, etc. properties in impact.', async () => {
          const ompl = await openYamlFileAsObject(`${path}/${file}`);
          const res: string = JSON.stringify(
            ompl['graph']['children']['child']['impacts'][0]
          );

          expect(
            res.includes('energy-memory') &&
              res.includes('energy-cpu') &&
              res.includes('energy-network') &&
              res.includes('energy') &&
              res.includes('operational-carbon')
          ).toBeTruthy();
        });
      }
    });
  });
});