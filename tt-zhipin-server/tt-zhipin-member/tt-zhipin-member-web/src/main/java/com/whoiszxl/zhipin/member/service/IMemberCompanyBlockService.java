package com.whoiszxl.zhipin.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.whoiszxl.zhipin.member.cqrs.command.CompanyBlockCommand;
import com.whoiszxl.zhipin.member.cqrs.response.CompanyBlockResponse;
import com.whoiszxl.zhipin.member.entity.MemberCompanyBlock;

import java.util.List;

public interface IMemberCompanyBlockService extends IService<MemberCompanyBlock> {

    List<CompanyBlockResponse> listCurrent();

    Boolean addCurrent(CompanyBlockCommand command);

    Boolean deleteCurrent(CompanyBlockCommand command);
}
