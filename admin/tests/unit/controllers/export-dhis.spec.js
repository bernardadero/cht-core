describe('dhis2 export controller', () => {
  const { expect } = chai;

  const dataSet = 'abc123';
  const dhisDataSets = [
    { guid: dataSet, label: 'dataset label' },
  ];

  const NOW = moment('2000-01-01').valueOf();

  let scope;
  let getService;
  let query;
  let Settings;

  beforeEach(() => {
    module('adminApp');
    sinon.useFakeTimers(NOW);
    Settings = sinon.stub().resolves({ dhisDataSets });
    query = sinon.stub().resolves({ rows: [
      mockContact('p1'),
      mockContact('p2', { dhis: { dataElement: 'p2-de '}}),
      mockContact('p3', { dhis: [
        { dataElement: 'p3-de', dataSet },
        { dataElement: 'p3-other', dataSet: 'other' }
      ]}),
    ] });

    module($provide => {
      $provide.value('Settings', Settings);
      $provide.value('$scope', scope);
    });
    
    inject(($controller, _$rootScope_) => {
      scope = _$rootScope_.$new();
      getService = async () => {
        const result = $controller('ExportDhisCtrl', {
          $scope: scope,
          DB: () => ({ query }),
        });
        await Settings.returnValues[0];
        await query.returnValues[0];
        
        return result;
      };
    });
  });
  afterEach(() => { sinon.restore(); });

  it('load scope for valid config', async () => {
    await getService();
    expect(scope.dataSets).to.deep.eq(dhisDataSets);
    expect(scope.periods).to.deep.eq([
      {
        timestamp: '946713600000',
        description: 'January, 2000'
      },
      {
        timestamp: '944035200000',
        description: 'December, 1999'
      },
      {
        timestamp: '941443200000',
        description: 'November, 1999'
      },
      {
        timestamp: '938761200000',
        description: 'October, 1999'
      },
      {
        timestamp: '936169200000',
        description: 'September, 1999'
      },
      {
        timestamp: '933490800000',
        description: 'August, 1999'
      }
    ]);
    
    expect(scope.places).to.deep.eq({ 
      null: [{ id: 'contact-p2', name: 'p2' }],
      [dataSet]: [
        { id: 'contact-p1', name: 'p1' },
        { id: 'contact-p3', name: 'p3' }
      ],
      other: [{ id: 'contact-p3', name: 'p3' }],
    });

    expect(scope.selected).to.deep.eq({ dataSet });
  });

  it('no dhis configuration', async () => {
    Settings.resolves({});
    await getService();
    expect(!!scope.dataSets).to.be.false;
  });

  const mockContact = (name, assign) => ({
    id: `contact-${name}`,
    doc: Object.assign({
      _id: `contact-${name}`,
      type: 'contact',
      contact_type: 'person',
      name,
      dhis: {
        dataSet,
        dataElement: 'dataElementGuid',
      },
    }, assign),
  });
  
});
