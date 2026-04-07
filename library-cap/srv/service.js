const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Books } = this.entities;

    // Before CREATE validation
    this.before('CREATE', Books, (req) => {
        if (req.data.stock < 0) {
            req.error(400, 'Stock cannot be negative');
        }
    });

    // Reduce stock when book is issued
    this.after('CREATE', 'BookIssues', async (data, req) => {

        const tx = cds.transaction(req);

        let book = await tx.run(
            SELECT.one.from(Books).where({ ID: data.book_ID })
        );

        if (book.stock <= 0) {
            req.error('Book not available');
        }

        await tx.run(
            UPDATE(Books)
                .set({ stock: book.stock - 1 })
                .where({ ID: data.book_ID })
        );
    });
});