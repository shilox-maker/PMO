const Joi = require('joi');
const {
  projectCreateSchema,
  projectUpdateSchema,
  invoiceCreateSchema,
  issueCreateSchema,
  validateBody
} = require('../middlewares/validation');

describe('Payload Validation Schemas (Joi)', () => {
  
  describe('Project Create Schema', () => {
    it('debería validar correctamente un proyecto válido completo', () => {
      const validProject = {
        id_proyecto: 'PRJ-2026-001',
        nombre_proyecto: 'Proyecto Migración Azure SQL',
        descripcion: 'Migración del backend de SQLite a Azure SQL Server.',
        id_pm: 1,
        id_sede: 2,
        fecha_inicio: '2026-07-06',
        es_capex: false,
        budget_inicial: 50000.00
      };
      
      const { error } = projectCreateSchema.validate(validProject);
      expect(error).toBeUndefined();
    });

    it('debería fallar si el formato del id_proyecto no es correcto', () => {
      const invalidProject = {
        id_proyecto: 'INVALID-ID',
        nombre_proyecto: 'Proyecto Invalido',
        descripcion: 'Un proyecto con ID erroneo',
        id_pm: 1,
        id_sede: 2,
        fecha_inicio: '2026-07-06'
      };
      
      const { error } = projectCreateSchema.validate(invalidProject);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('El ID del proyecto debe tener el formato PRJ-YYYY-XXX');
    });

    it('debería requerir codigo_capex si es_capex es true', () => {
      const capexProjectWithoutCode = {
        id_proyecto: 'PRJ-2026-002',
        nombre_proyecto: 'Proyecto CAPEX sin codigo',
        descripcion: 'Capex test',
        id_pm: 1,
        id_sede: 2,
        fecha_inicio: '2026-07-06',
        es_capex: true
      };
      
      const { error } = projectCreateSchema.validate(capexProjectWithoutCode);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('El código CAPEX es obligatorio cuando el proyecto es CAPEX.');
    });

    it('debería pasar la validación de CAPEX si se incluye codigo_capex', () => {
      const capexProjectWithCode = {
        id_proyecto: 'PRJ-2026-002',
        nombre_proyecto: 'Proyecto CAPEX con codigo',
        descripcion: 'Capex test',
        id_pm: 1,
        id_sede: 2,
        fecha_inicio: '2026-07-06',
        es_capex: true,
        codigo_capex: 'CPX-999-AZ'
      };
      
      const { error } = projectCreateSchema.validate(capexProjectWithCode);
      expect(error).toBeUndefined();
    });
  });

  describe('Invoice Create Schema', () => {
    it('debería requerir campos obligatorios como id_proyecto, concepto e importe', () => {
      const emptyInvoice = {};
      const { error } = invoiceCreateSchema.validate(emptyInvoice, { abortEarly: false });
      expect(error).toBeDefined();
      const fields = error.details.map(d => d.context.key);
      expect(fields).toContain('id_proyecto');
      expect(fields).toContain('concepto');
      expect(fields).toContain('fecha_factura');
      expect(fields).toContain('importe');
      expect(fields).toContain('estado');
    });
  });

  describe('Issue Create Schema', () => {
    it('debería requerir solucion_aplicada obligatoriamente cuando el estado sea RESUELTA', () => {
      const resolvedIssueWithoutSolution = {
        id_proyecto: 'PRJ-2026-001',
        titulo: 'Fallo de conexion en test',
        descripcion: 'Timeout de la red',
        tipo_incidencias: 'TECNICA',
        criticidad: 'ALTA',
        estado: 'RESUELTA',
        fecha_apertura: '2026-07-06'
      };
      
      const { error } = issueCreateSchema.validate(resolvedIssueWithoutSolution);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La solución aplicada es obligatoria cuando la incidencia está RESUELTA.');
    });

    it('debería permitir solucion_aplicada vacía o no definida cuando el estado sea ABIERTA', () => {
      const openIssueWithoutSolution = {
        id_proyecto: 'PRJ-2026-001',
        titulo: 'Fallo de conexion en test',
        descripcion: 'Timeout de la red',
        tipo_incidencias: 'TECNICA',
        criticidad: 'ALTA',
        estado: 'ABIERTA',
        fecha_apertura: '2026-07-06'
      };
      
      const { error } = issueCreateSchema.validate(openIssueWithoutSolution);
      expect(error).toBeUndefined();
    });
  });

  describe('validateBody Express Middleware', () => {
    it('debería llamar a next() si el payload es válido y limpiar propiedades desconocidas (stripUnknown)', () => {
      const mockReq = {
        body: {
          id_proyecto: 'PRJ-2026-001',
          nombre_proyecto: 'Proyecto Test',
          descripcion: 'Descripción',
          id_pm: 1,
          id_sede: 2,
          fecha_inicio: '2026-07-06',
          propiedad_inyectada_maliciosa: 'hacker'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      const middleware = validateBody(projectCreateSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.propiedad_inyectada_maliciosa).toBeUndefined(); // stripUnknown en acción
      expect(mockReq.body.id_proyecto).toBe('PRJ-2026-001');
    });

    it('debería responder con error 400 si el payload es inválido', () => {
      const mockReq = {
        body: {
          id_proyecto: 'PRJ-2026-001'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      const middleware = validateBody(projectCreateSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
