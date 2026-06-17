package com.whoiszxl.zhipin.im.service.impl;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.conditions.update.LambdaUpdateChainWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.whoiszxl.zhipin.im.constants.TalkTypeEnum;
import com.whoiszxl.zhipin.im.cqrs.command.TalkAddCommand;
import com.whoiszxl.zhipin.im.cqrs.command.TalkDeleteCommand;
import com.whoiszxl.zhipin.im.cqrs.query.TalkQuery;
import com.whoiszxl.zhipin.im.cqrs.response.TalkResponse;
import com.whoiszxl.zhipin.im.entity.Talk;
import com.whoiszxl.zhipin.im.mapper.TalkMapper;
import com.whoiszxl.zhipin.im.pack.PrivateChatReadPack;
import com.whoiszxl.zhipin.im.service.ITalkService;
import com.whoiszxl.zhipin.member.dto.MemberDTO;
import com.whoiszxl.zhipin.member.feign.MemberFeignClient;
import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.entity.response.PageResponse;
import com.whoiszxl.zhipin.tools.common.token.TokenHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TalkServiceImpl extends ServiceImpl<TalkMapper, Talk> implements ITalkService {

    private static final int FIRST_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final String DEFAULT_AVATAR = "https://tt-zhipin-oss.oss-cn-shenzhen.aliyuncs.com/image/default2.png";
    private static final String DEFAULT_COMPANY_ABBR_NAME = "AI智聘";

    private final TokenHelper tokenHelper;
    private final MemberFeignClient memberFeignClient;

    @Override
    public void read(PrivateChatReadPack privateChatReadPack) {
        Talk talk = this.getById(privateChatReadPack.getTalkId());
        if(talk == null) {
            talk = buildTalk(
                    privateChatReadPack.getFromMemberId(),
                    privateChatReadPack.getToMemberId(),
                    privateChatReadPack.getTalkType());
            talk.setReadSequence(privateChatReadPack.getSequence());
            this.save(talk);
            return;
        }

        talk.setReadSequence(privateChatReadPack.getSequence());
        LambdaUpdateChainWrapper<Talk> wrapper = this.lambdaUpdate()
                .eq(Talk::getId, talk.getId())
                .lt(Talk::getReadSequence, privateChatReadPack.getSequence());
        this.update(talk, wrapper);
    }

    @Override
    public Boolean add(TalkAddCommand command) {
        ensurePrivateTalk(command);
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TalkResponse ensurePrivateTalk(TalkAddCommand command) {
        Long currentMemberId = tokenHelper.getAppMemberId();
        Long targetMemberId = command.getToMemberId();
        Integer talkType = command.getTalkType() == null ? TalkTypeEnum.PRIVATE_CHAT.getCode() : command.getTalkType();

        Assert.notNull(currentMemberId, "当前登录用户不能为空");
        Assert.notNull(targetMemberId, "接收会话的用户ID不能为空");
        Assert.isTrue(!Objects.equals(currentMemberId, targetMemberId), "不能和自己发起会话");
        Assert.isTrue(TalkTypeEnum.PRIVATE_CHAT.getCode().equals(talkType), "当前接口仅支持私聊会话");

        MemberDTO currentMember = requireMember(currentMemberId, "当前用户不存在");
        MemberDTO targetMember = requireMember(targetMemberId, "接收会话的用户不存在");

        Talk currentMemberTalk = saveOrUpdateVisibleTalk(
                targetMemberId,
                currentMemberId,
                talkType,
                buildMemberInfo(targetMember));
        saveOrUpdateVisibleTalk(
                currentMemberId,
                targetMemberId,
                talkType,
                buildMemberInfo(currentMember));

        return toResponse(currentMemberTalk);
    }

    @Override
    public Boolean delete(TalkDeleteCommand command) {
        Long memberId = tokenHelper.getAppMemberId();
        return this.remove(Wrappers.<Talk>lambdaQuery()
                .eq(Talk::getId, command.getTalkId())
                .eq(Talk::getToMemberId, memberId));
    }

    @Override
    public PageResponse<TalkResponse> talkList(TalkQuery talkQuery) {
        normalizePageQuery(talkQuery);
        Long currentMemberId = tokenHelper.getAppMemberId();
        LambdaQueryWrapper<Talk> queryWrapper = Wrappers.<Talk>lambdaQuery()
                .eq(Talk::getToMemberId, currentMemberId)
                .orderByDesc(Talk::getTopStatus)
                .orderByDesc(Talk::getUpdatedAt)
                .orderByDesc(Talk::getCreatedAt)
                .orderByDesc(Talk::getId);
        IPage<Talk> talkPage = this.page(talkQuery.toPage(), queryWrapper);

        PageResponse<TalkResponse> pageResponse = new PageResponse<>();
        List<TalkResponse> list = talkPage.getRecords() == null
                ? new ArrayList<>()
                : talkPage.getRecords().stream().map(this::toResponseWithStableMemberInfo).collect(Collectors.toList());
        pageResponse.setList(list);
        pageResponse.setTotal(talkPage.getTotal());

        if(FIRST_PAGE == talkQuery.getPage()) {
            pageResponse.getList().add(0, buildGptTalk());
            pageResponse.setTotal(pageResponse.getTotal() + 1);
        }
        return pageResponse;
    }

    private Talk saveOrUpdateVisibleTalk(Long fromMemberId, Long toMemberId, Integer talkType, String fromMemberInfo) {
        Talk talk = findTalk(fromMemberId, toMemberId, talkType);
        if(talk == null) {
            talk = buildTalk(fromMemberId, toMemberId, talkType);
            talk.setFromMemberInfo(fromMemberInfo);
            this.save(talk);
            return talk;
        }

        if(!hasUsableMemberInfo(talk.getFromMemberInfo())) {
            talk.setFromMemberInfo(fromMemberInfo);
            this.updateById(talk);
        }
        return talk;
    }

    private Talk findTalk(Long fromMemberId, Long toMemberId, Integer talkType) {
        return this.getOne(Wrappers.<Talk>lambdaQuery()
                .eq(Talk::getFromMemberId, fromMemberId)
                .eq(Talk::getToMemberId, toMemberId)
                .eq(Talk::getTalkType, talkType)
                .last("LIMIT 1"));
    }

    private TalkResponse toResponseWithStableMemberInfo(Talk talk) {
        if(!hasUsableMemberInfo(talk.getFromMemberInfo())) {
            MemberDTO memberDTO = findMember(talk.getFromMemberId());
            talk.setFromMemberInfo(memberDTO == null
                    ? buildFallbackMemberInfo(talk.getFromMemberId())
                    : buildMemberInfo(memberDTO));
            this.updateById(talk);
        }
        return toResponse(talk);
    }

    private TalkResponse toResponse(Talk talk) {
        return TalkResponse.builder()
                .id(talk.getId())
                .talkType(talk.getTalkType())
                .fromMemberId(talk.getFromMemberId())
                .fromMemberInfo(talk.getFromMemberInfo())
                .toMemberId(talk.getToMemberId())
                .muteStatus(talk.getMuteStatus())
                .topStatus(talk.getTopStatus())
                .readSequence(talk.getReadSequence())
                .sequence(talk.getSequence())
                .createdAt(talk.getCreatedAt())
                .build();
    }

    private void normalizePageQuery(TalkQuery talkQuery) {
        if(talkQuery.getPage() == null) {
            talkQuery.setPage(FIRST_PAGE);
        }
        if(talkQuery.getSize() == null) {
            talkQuery.setSize(DEFAULT_PAGE_SIZE);
        }
    }

    private MemberDTO requireMember(Long memberId, String message) {
        MemberDTO memberDTO = findMember(memberId);
        Assert.notNull(memberDTO, message);
        return memberDTO;
    }

    private MemberDTO findMember(Long memberId) {
        try {
            ResponseResult<MemberDTO> response = memberFeignClient.getMemberInfoById(memberId);
            return response == null ? null : response.getData();
        } catch (Exception e) {
            log.warn("Failed to fetch member info for talk. memberId={}", memberId, e);
            return null;
        }
    }

    private String buildMemberInfo(MemberDTO memberDTO) {
        JSONObject jsonObject = JSONUtil.createObj();
        jsonObject.set("id", String.valueOf(memberDTO.getId()));
        jsonObject.set("name", StrUtil.blankToDefault(memberDTO.getFullName(), "用户" + memberDTO.getId()));
        jsonObject.set("avatar", StrUtil.blankToDefault(memberDTO.getAvatar(), DEFAULT_AVATAR));
        jsonObject.set("jobTitle", Objects.equals(memberDTO.getIsToutou(), 1) ? "招聘者" : "求职者");
        jsonObject.set("companyAbbrName", DEFAULT_COMPANY_ABBR_NAME);
        return jsonObject.toString();
    }

    private String buildFallbackMemberInfo(Long memberId) {
        JSONObject jsonObject = JSONUtil.createObj();
        jsonObject.set("id", String.valueOf(memberId));
        jsonObject.set("name", "用户" + memberId);
        jsonObject.set("avatar", DEFAULT_AVATAR);
        jsonObject.set("jobTitle", "用户");
        jsonObject.set("companyAbbrName", DEFAULT_COMPANY_ABBR_NAME);
        return jsonObject.toString();
    }

    private boolean hasUsableMemberInfo(String memberInfo) {
        String value = StrUtil.trim(memberInfo);
        if(StrUtil.isBlank(value) || !value.startsWith("{") || !value.endsWith("}")) {
            return false;
        }
        try {
            JSONObject jsonObject = JSONUtil.parseObj(value);
            return StrUtil.isNotBlank(jsonObject.getStr("name"))
                    && StrUtil.isNotBlank(jsonObject.getStr("avatar"));
        } catch (Exception e) {
            return false;
        }
    }

    private TalkResponse buildGptTalk() {
        return TalkResponse.builder()
                .id(-1L)
                .talkType(TalkTypeEnum.GPT_CHAT.getCode())
                .fromMemberInfo(JSONUtil.createObj()
                        .set("name", "TT智能问答")
                        .set("avatar", DEFAULT_AVATAR)
                        .set("jobTitle", "助手")
                        .set("companyAbbrName", DEFAULT_COMPANY_ABBR_NAME)
                        .toString())
                .fromMemberId(-1L)
                .toMemberId(tokenHelper.getAppMemberId())
                .muteStatus(0)
                .topStatus(0)
                .readSequence(0L)
                .sequence(0L)
                .build();
    }

    private Talk buildTalk(Long fromMemberId, Long toMemberId, Integer talkType) {
        Talk talk = new Talk();
        talk.setId(IdUtil.getSnowflakeNextId());
        talk.setFromMemberId(fromMemberId);
        talk.setToMemberId(toMemberId);
        talk.setTalkType(talkType);
        talk.setMuteStatus(0);
        talk.setTopStatus(0);
        talk.setReadSequence(0L);
        talk.setSequence(0L);
        talk.setVersion(1L);
        talk.setStatus(1);
        talk.setIsDeleted(0);
        return talk;
    }
}
