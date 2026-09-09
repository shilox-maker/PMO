const { Op } = require('sequelize');
const { 
  Proveedores, ContactosProveedor, Proyectos, Usuarios, Sedes, EstadosProyecto, Incidencias, LeccionesAprendidas 
} = require('../models/index');
const { getProjectCalculations, getProjectsCalculationsBatch } = require('../models/automations');
const { asyncHandler } = require('../middlewares/errorHandler');

const getVendors = asyncHandler(async (req, res) => {
    const vendors = await Proveedores.findAll({
      order: [['nombre_razon_social', 'ASC']]
    });
    res.json(vendors);
});

const getVendorDetail = asyncHandler(async (req, res) => {
    const { id_proveedor } = req.params;
    const vendor = await Proveedores.findByPk(id_proveedor, {
      include: [
        { model: ContactosProveedor }
      ]
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const projectWhere = { id_proveedor };
    if (req.currentAmbitoId && req.currentAmbitoId !== 'ALL') {
      projectWhere.id_ambito = req.currentAmbitoId;
    }

    const projects = await Proyectos.findAll({
      where: projectWhere,
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado', 'icono'] }
      ]
    });

    const calcMap = await getProjectsCalculationsBatch(projects);
    const projectsWithCalculations = projects.map((project) => ({
      ...project.toJSON(),
      calculations: calcMap.get(project.id_proyecto) || {}
    }));

    const projectIds = projects.map(p => p.id_proyecto);
    const incidents = projectIds.length > 0 
      ? await Incidencias.findAll({
          where: { id_proyecto: { [Op.in]: projectIds } },
          include: [{ model: Proyectos, attributes: ['nombre_proyecto'] }],
          order: [['fecha_apertura', 'DESC']]
        })
      : [];

    const lessonsWhere = projectIds.length > 0
      ? {
          [Op.or]: [
            { id_proveedor },
            { id_proyecto: { [Op.in]: projectIds } }
          ]
        }
      : { id_proveedor };

    const lessons = await LeccionesAprendidas.findAll({
      where: lessonsWhere,
      include: [
        { model: Proyectos, as: 'Proyecto', attributes: ['nombre_proyecto'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      vendor: vendor.toJSON(),
      projects: projectsWithCalculations,
      incidents,
      lessons
    });
});

const createVendor = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.telefono_general || data.telefono_general === '') data.telefono_general = null;
    if (!data.email_general || data.email_general === '') data.email_general = null;
    const vendor = await Proveedores.create(data);
    res.status(201).json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
    const { id_proveedor } = req.params;
    const data = { ...req.body };
    if (data.hasOwnProperty('telefono_general') && (!data.telefono_general || data.telefono_general === '')) data.telefono_general = null;
    if (data.hasOwnProperty('email_general') && (!data.email_general || data.email_general === '')) data.email_general = null;
    const vendor = await Proveedores.findByPk(id_proveedor);
    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    await vendor.update(data);
    res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
    const { id_proveedor } = req.params;
    const vendor = await Proveedores.findByPk(id_proveedor);
    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const projectCount = await Proyectos.count({ where: { id_proveedor } });
    if (projectCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el proveedor porque tiene proyectos activos asociados.' });
    }

    await vendor.destroy();
    res.json({ message: 'Proveedor eliminado con éxito' });
});

const createContact = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (!data.telefono || data.telefono === '') data.telefono = null;
    const contact = await ContactosProveedor.create(data);
    res.status(201).json(contact);
});

const updateContact = asyncHandler(async (req, res) => {
    const { id_contacto } = req.params;
    const data = { ...req.body };
    if (data.hasOwnProperty('telefono') && (!data.telefono || data.telefono === '')) data.telefono = null;
    const contact = await ContactosProveedor.findByPk(id_contacto);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    await contact.update(data);
    res.json(contact);
});

const deleteContact = asyncHandler(async (req, res) => {
    const { id_contacto } = req.params;
    const contact = await ContactosProveedor.findByPk(id_contacto);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    await contact.destroy();
    res.json({ message: 'Contacto eliminado con éxito' });
});

module.exports = {
  getVendors,
  getVendorDetail,
  createVendor,
  updateVendor,
  deleteVendor,
  createContact,
  updateContact,
  deleteContact
};

