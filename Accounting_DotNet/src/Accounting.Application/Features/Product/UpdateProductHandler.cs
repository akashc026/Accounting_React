using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateProductHandler : UpdateEntityHandler<AccountingDbContext, Product, Guid, UpdateProduct, Guid>
    {
        public UpdateProductHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Product UpdateEntity(UpdateProduct request, Product entity, IMapper mapper)
        {
            // Only update fields that are provided (not null)
            if (request.ItemCode != null)
                entity.ItemCode = request.ItemCode;

            if (request.ItemName != null)
                entity.ItemName = request.ItemName;

            if (request.ItemType.HasValue)
                entity.ItemType = request.ItemType;

            if (request.InventoryAccount.HasValue)
                entity.InventoryAccount = request.InventoryAccount;

            if (request.COGSAccount.HasValue)
                entity.COGSAccount = request.COGSAccount;

            if (request.SalesAccount.HasValue)
                entity.SalesAccount = request.SalesAccount;

            if (request.ExpenseAccount.HasValue)
                entity.ExpenseAccount = request.ExpenseAccount;

            if (request.SalesPrice.HasValue)
                entity.SalesPrice = request.SalesPrice;

            if (request.PurchasePrice.HasValue)
                entity.PurchasePrice = request.PurchasePrice;

            if (request.StandardCost.HasValue)
                entity.StandardCost = request.StandardCost;

            if (request.PurchaseTaxCode.HasValue)
                entity.PurchaseTaxCode = request.PurchaseTaxCode;

            if (request.SalesTaxCode.HasValue)
                entity.SalesTaxCode = request.SalesTaxCode;

            if (request.Inactive.HasValue)
                entity.Inactive = request.Inactive;

            if (request.AverageCost.HasValue)
                entity.AverageCost = request.AverageCost;

            if (request.Form.HasValue)
                entity.Form = request.Form;

            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;

            return entity;
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateProduct, Product> args)
        {
            return args.Entity.Id;
        }
    }
}