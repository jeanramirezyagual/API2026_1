import { conmysql } from "../db.js"
export const getClientes=
    async (req,res)=>{
        try {
        const [result]= await conmysql.query(' select * from clientes')
        res.json(result)
    } catch (error) {
        return res.status(500).json({message:"Error al consultar clientes"})
    }
    }
    

export const getClientesxid= async (req,res)=>{
    try {
        const [result]= await conmysql.query(' select * from clientes where cli_id=?', [req.params.id])
        if(result.length<=0) return res.json({
            cant: 0,
            message: "cliente no encontrado"
        })
        res.json({
            cantidad: result.length,
            informacion: result[0]
        }) ;
    } catch (error) {
        return res.status(500).json({message:"error en el servidor"});
    }
    
}

export const postInsertarCliente= async (req,res)=>{
    try {
        const {cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad}=req.body
        
        const[result]=await conmysql.query(
            'insert into clientes(cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad) values(?,?,?,?,?,?,?)',
            [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad]
        )
        res.send({cli_id:result.insertId})

    } catch (error) {
        return res.status(500).json({message:"error en el servidor"});
    }
    
}

export const pathCliente= async (req,res)=>{
    try {
        const {id}=req.params
        const {cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad}=req.body
        console.log(req.params)
        const[result]=await conmysql.query(
            'update clientes set cli_identificacion=?, cli_nombre=?, cli_telefono=?, cli_correo=?, cli_direccion=?, cli_pais=?, cli_ciudad=? where cli_id=? ', 
            [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad, id]

            
        )
        res.send({message: "Cliente modificado"})

    } catch (error) {
        return res.status(500).json({message:"error en el servidor"});
    }
    
}

export const putCliente = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            cli_identificacion,
            cli_nombre,
            cli_telefono,
            cli_correo,
            cli_direccion,
            cli_pais,
            cli_ciudad
        } = req.body;

        const [result] = await conmysql.query(
            `UPDATE clientes
             SET cli_identificacion=?,
                 cli_nombre=?,
                 cli_telefono=?,
                 cli_correo=?,
                 cli_direccion=?,
                 cli_pais=?,
                 cli_ciudad=?
             WHERE cli_id=?`,
            [
                cli_identificacion,
                cli_nombre,
                cli_telefono,
                cli_correo,
                cli_direccion,
                cli_pais,
                cli_ciudad,
                id
            ]
        );

        res.json({
            message: 'Cliente actualizado correctamente'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error en el servidor'
        });

    }

};
export const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await conmysql.query(
            'DELETE FROM clientes WHERE cli_id = ?', 
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: "No se pudo eliminar: El cliente no existe" 
            });
        }

        return res.json({ message: "Cliente eliminado correctamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: "Error en el servidor al intentar eliminar" 
        });
    }
}