import { TestBed } from '@angular/core/testing';

import { NodeData } from './node.interface';
import { NodeMapper } from './node.mapper';

const OILCORP_GERMANY: NodeData = {
  id: 'OilCorp_Germany',
  attributes: {
    description: 'The German division of Oil Corp.',
    name: 'Oil Corp Germany',
  },
  relationships: {
    organization: {
      data: {
        id: 'oilcorp.example.org',
      },
    },
    childNodes: {
      data: [{ id: 'OilCorp_Berlin' }, { id: 'OilCorp_Jena' }],
    },
    parentNode: { data: undefined },
  },
};

const OILCORP_BERLIN: NodeData = {
  id: 'OilCorp_Berlin',
  attributes: {
    description: 'The Berlin headquarter of Oil Corp.',
    name: 'Oil Corp Berlin',
  },
  relationships: {
    organization: {
      data: {
        id: 'oilcorp.example.org',
      },
    },
    childNodes: undefined,
    parentNode: {
      data: {
        id: 'OilCorp_Germany',
      },
    },
  },
};

describe('Node Mapper', () => {
  let nodeMapper: NodeMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    nodeMapper = TestBed.inject(NodeMapper);
  });

  describe('fromData', () => {
    it('should throw when input is falsy', () => {
      expect(() => nodeMapper.fromData(undefined)).toThrow();
    });

    it('should map incoming data to model data', () => {
      const data = OILCORP_BERLIN;
      const mapped = nodeMapper.fromData(data);

      expect(mapped).toHaveProperty('nodes.OilCorp_Berlin');
      const mappedElement = mapped.nodes.OilCorp_Berlin;
      expect(mappedElement).toHaveProperty('id', 'OilCorp_Berlin');
      expect(mappedElement).toHaveProperty('name', 'Oil Corp Berlin');
      expect(mappedElement).toHaveProperty('description', 'The Berlin headquarter of Oil Corp.');
      expect(mappedElement).toHaveProperty('organization', 'oilcorp.example.org');
      expect(mappedElement).not.toHaveProperty('childNodes');
      expect(mappedElement).not.toHaveProperty('parentNode');
    });

    it('should map incoming data with childnodes to model data', () => {
      const data = OILCORP_GERMANY;
      const mapped = nodeMapper.fromData(data);
      expect(mapped).toHaveProperty('edges.OilCorp_Germany', ['OilCorp_Berlin', 'OilCorp_Jena']);
    });
  });
});
