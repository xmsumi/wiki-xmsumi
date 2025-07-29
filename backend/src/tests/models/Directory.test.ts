import { Directory } from '@/models/Directory';
import { DirectoryEntity, CreateDirectoryRequest, UpdateDirectoryRequest } from '@/types/directory';

describe('Directory Model', () => {
  const mockDirectoryEntity: DirectoryEntity = {
    id: 1,
    name: '技术文档',
    description: '技术相关的文档目录',
    parent_id: null,
    path: '/技术文档',
    sort_order: 0,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  };

  describe('构造函数', () => {
    it('应该正确创建Directory实例', () => {
      const directory = new Directory(mockDirectoryEntity);

      expect(directory.id).toBe(1);
      expect(directory.name).toBe('技术文档');
      expect(directory.description).toBe('技术相关的文档目录');
      expect(directory.parent_id).toBeNull();
      expect(directory.path).toBe('/技术文档');
      expect(directory.sort_order).toBe(0);
      expect(directory.created_at).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(directory.updated_at).toEqual(new Date('2024-01-01T00:00:00Z'));
    });
  });

  describe('fromCreateRequest', () => {
    it('应该从创建请求正确生成目录数据', () => {
      const createRequest: CreateDirectoryRequest = {
        name: '新目录',
        description: '新目录描述',
        sort_order: 1
      };

      const directoryData = Directory.fromCreateRequest(createRequest);

      expect(directoryData.name).toBe('新目录');
      expect(directoryData.description).toBe('新目录描述');
      expect(directoryData.parent_id).toBeUndefined();
      expect(directoryData.path).toBe('/新目录');
      expect(directoryData.sort_order).toBe(1);
      expect(directoryData.created_at).toBeInstanceOf(Date);
      expect(directoryData.updated_at).toBeInstanceOf(Date);
    });

    it('应该正确处理父目录路径', () => {
      const createRequest: CreateDirectoryRequest = {
        name: '子目录',
        parent_id: 1
      };

      const directoryData = Directory.fromCreateRequest(createRequest, '/父目录');

      expect(directoryData.path).toBe('/父目录/子目录');
    });

    it('应该设置默认值', () => {
      const createRequest: CreateDirectoryRequest = {
        name: '简单目录'
      };

      const directoryData = Directory.fromCreateRequest(createRequest);

      expect(directoryData.sort_order).toBe(0);
      expect(directoryData.description).toBeUndefined();
    });
  });

  describe('fromUpdateRequest', () => {
    it('应该从更新请求正确生成更新数据', () => {
      const updateRequest: UpdateDirectoryRequest = {
        name: '更新的名称',
        description: '更新的描述',
        sort_order: 2
      };

      const updateData = Directory.fromUpdateRequest(updateRequest);

      expect(updateData.name).toBe('更新的名称');
      expect(updateData.description).toBe('更新的描述');
      expect(updateData.sort_order).toBe(2);
      expect(updateData.updated_at).toBeInstanceOf(Date);
    });

    it('应该只包含提供的字段', () => {
      const updateRequest: UpdateDirectoryRequest = {
        name: '只更新名称'
      };

      const updateData = Directory.fromUpdateRequest(updateRequest);

      expect(updateData.name).toBe('只更新名称');
      expect(updateData.description).toBeUndefined();
      expect(updateData.sort_order).toBeUndefined();
      expect(updateData.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('toResponse', () => {
    it('应该正确转换为响应格式', () => {
      const directory = new Directory(mockDirectoryEntity);
      const response = directory.toResponse();

      expect(response.id).toBe(1);
      expect(response.name).toBe('技术文档');
      expect(response.description).toBe('技术相关的文档目录');
      expect(response.parent_id).toBeNull();
      expect(response.path).toBe('/技术文档');
      expect(response.sort_order).toBe(0);
      expect(response.created_at).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(response.updated_at).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('应该包含可选的子目录和文档数量', () => {
      const directory = new Directory(mockDirectoryEntity);
      const children = [directory.toResponse()];
      const response = directory.toResponse(children, 5, 10);

      expect(response.children).toEqual(children);
      expect(response.document_count).toBe(5);
      expect(response.total_document_count).toBe(10);
    });
  });

  describe('toTreeNode', () => {
    it('应该正确转换为树节点格式', () => {
      const directory = new Directory(mockDirectoryEntity);
      const treeNode = directory.toTreeNode([], 3, 8);

      expect(treeNode.id).toBe(1);
      expect(treeNode.name).toBe('技术文档');
      expect(treeNode.path).toBe('/技术文档');
      expect(treeNode.children).toEqual([]);
      expect(treeNode.document_count).toBe(3);
      expect(treeNode.total_document_count).toBe(8);
      expect(treeNode.level).toBe(1);
    });
  });

  describe('isRoot', () => {
    it('应该正确识别根目录', () => {
      const rootDirectory = new Directory(mockDirectoryEntity);
      expect(rootDirectory.isRoot()).toBe(true);
    });

    it('应该正确识别非根目录', () => {
      const childDirectory = new Directory({
        ...mockDirectoryEntity,
        parent_id: 1,
        path: '/技术文档/子目录'
      });
      expect(childDirectory.isRoot()).toBe(false);
    });
  });

  describe('getLevel', () => {
    it('应该正确计算根目录层级', () => {
      const directory = new Directory(mockDirectoryEntity);
      expect(directory.getLevel()).toBe(1);
    });

    it('应该正确计算子目录层级', () => {
      const childDirectory = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端/React'
      });
      expect(childDirectory.getLevel()).toBe(3);
    });
  });

  describe('getParentPath', () => {
    it('应该返回根目录的父路径', () => {
      const directory = new Directory(mockDirectoryEntity);
      expect(directory.getParentPath()).toBe('/');
    });

    it('应该返回子目录的父路径', () => {
      const childDirectory = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端/React'
      });
      expect(childDirectory.getParentPath()).toBe('/技术文档/前端');
    });
  });

  describe('isChildOf', () => {
    it('应该正确识别子目录关系', () => {
      const childDirectory = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端'
      });
      expect(childDirectory.isChildOf('/技术文档')).toBe(true);
      expect(childDirectory.isChildOf('/其他目录')).toBe(false);
    });
  });

  describe('isDirectChildOf', () => {
    it('应该正确识别直接子目录关系', () => {
      const directChild = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端'
      });
      const grandChild = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端/React'
      });

      expect(directChild.isDirectChildOf('/技术文档')).toBe(true);
      expect(grandChild.isDirectChildOf('/技术文档')).toBe(false);
      expect(grandChild.isDirectChildOf('/技术文档/前端')).toBe(true);
    });
  });

  describe('buildPath', () => {
    it('应该正确构建根目录路径', () => {
      const path = Directory.buildPath(undefined, '根目录');
      expect(path).toBe('/根目录');
    });

    it('应该正确构建子目录路径', () => {
      const path = Directory.buildPath('/父目录', '子目录');
      expect(path).toBe('/父目录/子目录');
    });

    it('应该处理根路径', () => {
      const path = Directory.buildPath('/', '目录');
      expect(path).toBe('/目录');
    });

    it('应该清理目录名称', () => {
      const path = Directory.buildPath('/父目录', '子目录/\\:*?"<>|');
      expect(path).toBe('/父目录/子目录');
    });
  });

  describe('sanitizeName', () => {
    it('应该移除非法字符', () => {
      const sanitized = Directory.sanitizeName('目录/\\:*?"<>|名称');
      expect(sanitized).toBe('目录名称');
    });

    it('应该处理多个空格', () => {
      const sanitized = Directory.sanitizeName('目录   名称');
      expect(sanitized).toBe('目录 名称');
    });

    it('应该移除开头和结尾的点', () => {
      const sanitized = Directory.sanitizeName('...目录名称...');
      expect(sanitized).toBe('目录名称');
    });
  });

  describe('validateName', () => {
    it('应该验证有效的目录名称', () => {
      expect(Directory.validateName('有效目录名')).toBe(true);
      expect(Directory.validateName('Valid Directory')).toBe(true);
      expect(Directory.validateName('目录123')).toBe(true);
    });

    it('应该拒绝无效的目录名称', () => {
      expect(Directory.validateName('')).toBe(false);
      expect(Directory.validateName('   ')).toBe(false);
      expect(Directory.validateName('目录/名称')).toBe(false);
      expect(Directory.validateName('目录\\名称')).toBe(false);
      expect(Directory.validateName('目录:名称')).toBe(false);
      expect(Directory.validateName('CON')).toBe(false);
      expect(Directory.validateName('.')).toBe(false);
      expect(Directory.validateName('..')).toBe(false);
    });

    it('应该拒绝过长的目录名称', () => {
      const longName = 'a'.repeat(256);
      expect(Directory.validateName(longName)).toBe(false);
    });

    it('应该拒绝非字符串类型', () => {
      expect(Directory.validateName(null as any)).toBe(false);
      expect(Directory.validateName(undefined as any)).toBe(false);
      expect(Directory.validateName(123 as any)).toBe(false);
    });
  });

  describe('validateDescription', () => {
    it('应该验证有效的描述', () => {
      expect(Directory.validateDescription('有效描述')).toBe(true);
      expect(Directory.validateDescription('')).toBe(true);
      expect(Directory.validateDescription(undefined)).toBe(true);
    });

    it('应该拒绝过长的描述', () => {
      const longDescription = 'a'.repeat(1001);
      expect(Directory.validateDescription(longDescription)).toBe(false);
    });

    it('应该拒绝非字符串类型', () => {
      expect(Directory.validateDescription(123 as any)).toBe(false);
    });
  });

  describe('validateSortOrder', () => {
    it('应该验证有效的排序顺序', () => {
      expect(Directory.validateSortOrder(0)).toBe(true);
      expect(Directory.validateSortOrder(1)).toBe(true);
      expect(Directory.validateSortOrder(100)).toBe(true);
      expect(Directory.validateSortOrder(undefined)).toBe(true);
    });

    it('应该拒绝无效的排序顺序', () => {
      expect(Directory.validateSortOrder(-1)).toBe(false);
      expect(Directory.validateSortOrder(1.5)).toBe(false);
      expect(Directory.validateSortOrder('1' as any)).toBe(false);
    });
  });

  describe('parsePathInfo', () => {
    it('应该正确解析路径信息', () => {
      const pathInfo = Directory.parsePathInfo('/技术文档/前端/React');
      
      expect(pathInfo).toHaveLength(3);
      expect(pathInfo[0]).toEqual({
        id: 0,
        name: '技术文档',
        path: '/技术文档',
        level: 1
      });
      expect(pathInfo[1]).toEqual({
        id: 0,
        name: '前端',
        path: '/技术文档/前端',
        level: 2
      });
      expect(pathInfo[2]).toEqual({
        id: 0,
        name: 'React',
        path: '/技术文档/前端/React',
        level: 3
      });
    });

    it('应该处理根路径', () => {
      const pathInfo = Directory.parsePathInfo('/');
      expect(pathInfo).toHaveLength(0);
    });
  });

  describe('buildTree', () => {
    it('应该正确构建目录树', () => {
      const directories = [
        new Directory({ ...mockDirectoryEntity, id: 1, name: '根目录1', path: '/根目录1', parent_id: null }),
        new Directory({ ...mockDirectoryEntity, id: 2, name: '根目录2', path: '/根目录2', parent_id: null }),
        new Directory({ ...mockDirectoryEntity, id: 3, name: '子目录1', path: '/根目录1/子目录1', parent_id: 1 }),
        new Directory({ ...mockDirectoryEntity, id: 4, name: '子目录2', path: '/根目录1/子目录2', parent_id: 1 })
      ];

      const documentCounts = new Map([[1, 2], [2, 1], [3, 3], [4, 0]]);
      const tree = Directory.buildTree(directories, documentCounts);

      expect(tree).toHaveLength(2);
      expect(tree[0].name).toBe('根目录1');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].total_document_count).toBe(5); // 2 + 3 + 0
      expect(tree[1].name).toBe('根目录2');
      expect(tree[1].children).toHaveLength(0);
      expect(tree[1].total_document_count).toBe(1);
    });
  });

  describe('getAncestorPaths', () => {
    it('应该返回所有祖先路径', () => {
      const directory = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端/React'
      });

      const ancestorPaths = directory.getAncestorPaths();
      expect(ancestorPaths).toEqual(['/', '/技术文档', '/技术文档/前端']);
    });

    it('应该为根目录返回空数组', () => {
      const directory = new Directory(mockDirectoryEntity);
      const ancestorPaths = directory.getAncestorPaths();
      expect(ancestorPaths).toEqual(['/']);
    });
  });

  describe('getDescendantPathPattern', () => {
    it('应该返回后代路径模式', () => {
      const directory = new Directory(mockDirectoryEntity);
      expect(directory.getDescendantPathPattern()).toBe('/技术文档/%');
    });

    it('应该处理根目录', () => {
      const rootDirectory = new Directory({
        ...mockDirectoryEntity,
        path: '/'
      });
      expect(rootDirectory.getDescendantPathPattern()).toBe('/%');
    });
  });

  describe('updatePath', () => {
    it('应该正确更新路径', () => {
      const directory = new Directory({
        ...mockDirectoryEntity,
        name: '子目录'
      });

      const newPath = directory.updatePath('/新父目录');
      expect(newPath).toBe('/新父目录/子目录');
    });
  });

  describe('wouldCreateCycle', () => {
    it('应该检测循环引用', () => {
      const directory = new Directory({
        ...mockDirectoryEntity,
        path: '/技术文档/前端'
      });

      expect(directory.wouldCreateCycle('/技术文档/前端/React')).toBe(true);
      expect(directory.wouldCreateCycle('/技术文档/前端')).toBe(true);
      expect(directory.wouldCreateCycle('/技术文档')).toBe(false);
      expect(directory.wouldCreateCycle('/其他目录')).toBe(false);
    });
  });
});