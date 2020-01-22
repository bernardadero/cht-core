const { expect } = require('chai');
const path = require('path');
const memdownMedic = require('@medic/memdown');
const moment = require('moment');
const sinon = require('sinon');

const service = require('../../../../src/services/export/dhis');
const db = require('../../../../src/db');
const defaultConfigSettings = {
  _id: 'settings',
  settings: require('../../../../../config/default/app_settings.json'),
};

const NOW = moment('2000-02-21');
const dataSet = 'abc123';
const filterNow = { from: Date.now() };

describe('dhis export service', () => {
  let medic;

  beforeEach(async () => {
    sinon.useFakeTimers(NOW.valueOf());
    medic = await memdownMedic(path.resolve('.'));
    sinon.stub(db, 'medic').value(medic);
  });
  afterEach(() => sinon.restore());

  it('sum all dataElements for interval (nominal)', async () => {
    const chu1 = mockContact('chu1');
    const chu2 = mockContact('chu2');
    const chw = mockContact('chw', { dhis: undefined, parent: { _id: chu1._id } });

    await medic.bulkDocs([
      defaultConfigSettings,
      chu1,
      chu2,
      chw,
      mockTargetDoc('ignore1', '2000-01'),
      mockTargetDoc('chw', '2000-02'),
      mockTargetDoc('chu1', '2000-02'),
      mockTargetDoc('chu2', '2000-02'),
      mockTargetDoc('ignore2', '2000-03'),
    ]);

    const actual = await service({
      date: {
        from: moment(NOW).valueOf(),
      },
      dataSet,
    });

    expect(actual).to.deep.eq({
      completeDate: '2000-02-21',
      dataSet,
      dataValues: [
        {
          dataElement: 'elBTM',
          orgUnit: 'ou-chu1',
          value: 24,
        },
        {
          dataElement: 'elFD',
          orgUnit: 'ou-chu1',
          value: 8,
        },
        {
          dataElement: 'elBTM',
          orgUnit: 'ou-chu2',
          value: 12,
        },
        {
          dataElement: 'elFD',
          orgUnit: 'ou-chu2',
          value: 4,
        },
      ],
      period: '200002',
    });
  });

  it('orgunit without target docs gets 0s', async () => {
    const chu = mockContact('chu');
    await medic.bulkDocs([defaultConfigSettings, chu]);
    const actual = await service({
      date: {
        from: moment(NOW).valueOf(),
      },
      dataSet,
    });

    expect(actual).to.deep.eq({
      completeDate: '2000-02-21',
      dataSet,
      dataValues: [
        {
          dataElement: 'elBTM',
          orgUnit: 'ou-chu',
          value: 0,
        },
        {
          dataElement: 'elFD',
          orgUnit: 'ou-chu',
          value: 0,
        },
      ],
      period: '200002',
    });
  });
  
  describe('humanReadable', () => {
    it('single dataSet, single', async () => {
      const chu = mockContact('chu');
      await medic.bulkDocs([
        defaultConfigSettings,
        chu,
        mockTargetDoc('chu', '2000-02'),
      ]);
      const actual = await service({
        date: {
          from: moment(NOW).valueOf(),
        },
        dataSet,
      }, { humanReadable: true });

      expect(actual.dataValues).to.deep.eq([
        {
          dataElement: 'births-this-month',
          orgUnit: 'chu',
          value: 12,
        },
        {
          dataElement: 'facility-deliveries',
          orgUnit: 'chu',
          value: 4,
        },
      ]);
    });

    it('contact with multiple orgUnits', async () => {
      const dhisConfig = [
        { orgUnit: 'ou-1', dataSet: 'ds-1' },
        { orgUnit: 'ou-2', dataSet: 'ds-2' },
      ];
      await medic.bulkDocs([
        settingsWithMultipleDatasets,
        mockContact('chu', { dhis: dhisConfig }),
      ]);
  
      const ds1 = await service({
        date: { from: moment(NOW).valueOf() },
        dataSet: 'ds-1',
      }, { humanReadable: true });
      expect(ds1).to.deep.eq({
        dataSet: 'dataset 1',
        completeDate: '2000-02-21',
        period: '200002',
        dataValues: [
          {
            dataElement: 'data element 1',
            orgUnit: 'chu',
            value: 0
          },
          {
            dataElement: 'data element both',
            orgUnit: 'chu',
            value: 0
          }
        ]
      });
    });
  });

  it('placeId filter', async () => {
    const chu1 = mockContact('chu1');
    const chu2 = mockContact('chu2');
    const chw = mockContact('chw', { dhis: undefined, parent: { _id: chu1._id } });

    await medic.bulkDocs([
      defaultConfigSettings,
      chu1,
      chu2,
      chw,
      mockTargetDoc('chw', '2000-02'),
      mockTargetDoc('chu1', '2000-02'),
      mockTargetDoc('chu2', '2000-02'),
    ]);

    const actual = await service({
      date: {
        from: moment(NOW).valueOf(),
      },
      dataSet,
      placeId: chu1._id,
    });

    expect(actual).to.deep.eq({
      completeDate: '2000-02-21',
      dataSet,
      dataValues: [
        {
          dataElement: 'elBTM',
          orgUnit: 'ou-chu1',
          value: 24,
        },
        {
          dataElement: 'elFD',
          orgUnit: 'ou-chu1',
          value: 8,
        },
      ],
      period: '200002',
    });
  });

  it('placeid without contacts is empty', async () => {
    await medic.bulkDocs([
      defaultConfigSettings,
      mockContact('chu', { dhis: { orgUnit: 'ou', dataSet: 'other' }}),
    ]);
    const actual = await service({
      date: {
        from: moment(NOW).valueOf(),
      },
      dataSet,
      placeId: 'chu',
    });

    expect(actual.dataValues).to.deep.eq([]);
  });

  it('contact without matching dataSet is not included', async () => {
    await medic.bulkDocs([
      defaultConfigSettings,
      mockContact('chu', { dhis: { orgUnit: 'ou', dataSet: 'other' }}),
    ]);
    const actual = await service({
      date: {
        from: moment(NOW).valueOf(),
      },
      dataSet,
      placeId: 'chu',
    });

    expect(actual.dataValues).to.deep.eq([]);
  });

  it('contact with multiple orgUnits', async () => {
    const dhisConfig = [
      { orgUnit: 'ou-1', dataSet: 'ds-1' },
      { orgUnit: 'ou-2', dataSet: 'ds-2' },
    ];
    await medic.bulkDocs([
      settingsWithMultipleDatasets,
      mockContact('chu', { dhis: dhisConfig }),
      mockTargetDoc('chu', '2000-02', { targets: [
        {
          id: 'data element 1',
          value: { pass: 0, total: 1 },
        },
        {
          id: 'data element 2',
          value: { pass: 0, total: 2 },
        },
        {
          id: 'data element both',
          value: { pass: 0, total: 100 },
        },
      ] }),
    ]);

    const ds1 = await service({
      date: { from: moment(NOW).valueOf() },
      dataSet: 'ds-1',
    });
    expect(ds1).to.deep.eq({
      dataSet: 'ds-1',
      completeDate: '2000-02-21',
      period: '200002',
      dataValues: [
        {
          dataElement: 'de-1',
          orgUnit: 'ou-1',
          value: 1
        },
        {
          dataElement: 'de-both',
          orgUnit: 'ou-1',
          value: 100
        }
      ]
    });

    const ds2 = await service({
      date: { from: moment(NOW).valueOf() },
      dataSet: 'ds-2',
    });
    expect(ds2).to.deep.eq({
      dataSet: 'ds-2',
      completeDate: '2000-02-21',
      period: '200002',
      dataValues: [
        {
          dataElement: 'de-2',
          orgUnit: 'ou-2',
          value: 2
        },
        {
          dataElement: 'de-both',
          orgUnit: 'ou-2',
          value: 100
        }
      ]
    });
  });

  it('targetdoc has owner with two org units in hierarchy', async () => {
    const hc = mockContact('hc', { dhis: { orgUnit: 'alt' } });
    const chu = mockContact('chu', { parent: { _id: hc._id }});
    const chw = mockContact('chw', { dhis: undefined, parent: { _id: chu._id, parent: chu.parent } });

    await medic.bulkDocs([
      defaultConfigSettings,
      chw,
      chu,
      hc,
      mockTargetDoc('chw', '2000-02'),
      mockTargetDoc('hc', '2000-02'),
    ]);

    const actual = await service({
      date: {
        from: moment(NOW).valueOf(),
      },
      dataSet,
    });

    expect(actual).to.deep.eq({
      completeDate: '2000-02-21',
      dataSet,
      period: '200002',
      dataValues: [
        {
          dataElement: 'elBTM',
          orgUnit: 'ou-chu',
          value: 12,
        },
        {
          dataElement: 'elFD',
          orgUnit: 'ou-chu',
          value: 4,
        },
        {
          dataElement: 'elBTM',
          orgUnit: 'alt',
          value: 24,
        },
        {
          dataElement: 'elFD',
          orgUnit: 'alt',
          value: 8,
        },
      ],
    });
  });

  it('target definitions for other dataSets are not included', async () => {
    const dataSet = 'myDataSet';
    await medic.bulkDocs([
      mockSettingsDoc(
        [{ guid: dataSet, label: 'my data set' }],
        [
          {
            id: 'relevant',
            dhis: {
              dataSet,
              dataElement: 'relevant',
            }
          },
          {
            id: 'irrelevant',
            dhis: {
              dataSet: 'other',
              dataElement: 'irrelevant',
            }
          },
        ],
      ),
      mockContact('chu'),
    ]);

    const actual = await service({ dataSet, date: filterNow });
    expect(actual.dataValues).to.deep.eq([{
      dataElement: 'relevant',
      orgUnit: 'ou-chu',
      value: 0
    }]);
  });

  it('throw on undefined dataset', async () => {
    await medic.bulkDocs([defaultConfigSettings]);
    try {
      await service({
        dataSet: 'dne',
        date: filterNow,
      });
      expect.fail('should throw');
    }
    catch (err) {
      expect(err.message).to.include('is not defined');
    }
  });

  it('throw on dataset without dataElements', async () => {
    await medic.bulkDocs([
      mockSettingsDoc(
        [{ guid: 'myDataSet', label: 'my data set' }],
        [{
          id: 'target',
          dhis: {
            dataSet: 'other',
            dataElement: 'de',
          }
        }]
      )
    ]);

    try {
      await service({
        dataSet: 'myDataSet',
        date: filterNow,
      });
      expect.fail('should throw');
    }
    catch (err) {
      expect(err.message).to.include('has no dataElements');
    }
  });

  it('throw on absent target definitions', async () => {
    const settings = mockSettingsDoc(
      [{ guid: 'ds-1' }]
    );
    await medic.bulkDocs([settings]);
    try {
      await service({ dataSet: 'ds-1', date: filterNow });
      expect.fail('should throw');
    }
    catch (err) {
      expect(err.message).to.include('has no dataElements');
    }
  });
});

const mockContact = (username, override) => Object.assign({
  _id: `${username}-guid`,
  type: 'contact',
  contact_type: 'person',
  name: username,
  dhis: {
    orgUnit: `ou-${username}`,
  }
}, override);

const mockTargetDoc = (username, interval, override) => Object.assign({
  _id: `target~${interval}~org.couchdb.user:${username}~${username}-guid`,
  type: 'target',
  owner: `${username}-guid`,
  user: `org.couchdb.user:${username}`,
  targets: [
    {
      id: 'births-this-month',
      value: {
        pass: 0,
        total: 12
      }
    },
    {
      id: 'facility-deliveries',
      value: {
        pass: 2,
        total: 4,
        percent: 50
      }
    },
  ]
}, override);

const mockSettingsDoc = (dataSets, targets) => ({
  _id: 'settings',
  settings: {
    dhisDataSets: dataSets,
    tasks: {
      targets: { items: targets }
    }
  },
});

const settingsWithMultipleDatasets = mockSettingsDoc(
  [
    { guid: 'ds-1', label: 'dataset 1' },
    { guid: 'ds-2', label: 'dataset 2' },
  ],
  [
    {
      id: 'data element 1',
      dhis: {
        dataSet: 'ds-1',
        dataElement: 'de-1',
      }
    },
    {
      id: 'data element 2',
      dhis: {
        dataSet: 'ds-2',
        dataElement: 'de-2',
      }
    },
    {
      id: 'data element both',
      dhis: {
        dataElement: 'de-both',
      }
    },
  ],
);
