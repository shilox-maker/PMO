const { Op } = require('sequelize');
const { 
  Proveedores, ContactosProveedor, Proyectos, Usuarios, Sedes, EstadosProyecto, Incidencias, LeccionesAprendidas 
} = require('../models/index');
const { getProjectCalculations } = require('../models/automations');
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

    const projects = await Proyectos.findAll({
      where: { id_proveedor },
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado', 'icono'] }
      ]
    });

    const projectsWithCalculations = await Promise.all(
      projects.map(async (project) => {
        const calc = await getProjectCalculations(
          project.id_proyecto,
          project.budget_inicial,
          project.fecha_fin_inicial
        );
        return {
          ...project.toJSON(),
          calculations: calc
        };
      })
    );

    const projectIds = projects.map(p => p.id_proyecto);
    const incidents = await Incidencias.findAll({
      where: { id_proyecto: projectIds },
      include: [{ model: Proyectos, attributes: ['nombre_proyecto'] }],
      order: [['fecha_apertura', 'DESC']]
    });

    const lessons = await LeccionesAprendidas.findAll({
      where: {
        [Op.or]: [
          { id_proveedor },
          { id_proyecto: projectIds }
        ]
      },
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
    const vendor = await Proveedores.create(req.body);
    res.status(201).json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
    const { id_proveedor } = req.params;
    const vendor = await Proveedores.findByPk(id_proveedor);
    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    await vendor.update(req.body);
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
    const contact = await ContactosProveedor.create(req.body);
    res.status(201).json(contact);
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
  deleteContact
};
