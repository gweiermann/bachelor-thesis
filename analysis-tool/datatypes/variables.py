from lldb import SBValueList

def transform_variable_list(varlist: SBValueList):
    return {var.GetName(): {
        'value': var.GetValue() if not var.GetType().IsReferenceType() else var.GetSummary(),
        'type': var.GetType().GetDisplayTypeName(),
        'isPointer': var.GetType().IsPointerType(),
        'isReference': var.GetType().IsReferenceType(),
    } for var in varlist}