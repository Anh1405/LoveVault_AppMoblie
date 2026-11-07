// src/constants/questionBank.ts
export type QuestionCategory =
  | 'ALL'
  | 'FUNNY'
  | 'DEEP'
  | 'FUTURE'
  | 'MEMORIES'
  | 'INTIMACY'
  | 'DILEMMA';

export interface CoupleQuestionItem {
  id: string;
  category: Exclude<QuestionCategory, 'ALL'>;
  text: string;
  hint: string;
}

export const QUESTION_CATEGORIES_META: Array<{
  id: QuestionCategory;
  label: string;
  icon: string;
  accentColor: string;
}> = [
  { id: 'ALL', label: 'Tất cả', icon: '✨', accentColor: '#EC4899' },
  { id: 'FUNNY', label: 'Vui vẻ', icon: '😂', accentColor: '#F59E0B' },
  { id: 'DEEP', label: 'Tâm sự', icon: '🌙', accentColor: '#6366F1' },
  { id: 'MEMORIES', label: 'Kỷ niệm', icon: '📸', accentColor: '#10B981' },
  { id: 'INTIMACY', label: 'Ngọt ngào', icon: '💕', accentColor: '#F43F5E' },
  { id: 'FUTURE', label: 'Tương lai', icon: '🏡', accentColor: '#0EA5E9' },
  { id: 'DILEMMA', label: 'Khó đỡ', icon: '🔥', accentColor: '#8B5CF6' },
];

export const COUPLE_QUESTION_BANK: CoupleQuestionItem[] = [
  // ================= 1. FUNNY (VUI NHỘN) =================
  {
    id: 'q_fun_01',
    category: 'FUNNY',
    text: 'Nếu hai đứa bị lạc trên đảo hoang, ai sẽ là người tìm ra đồ ăn trước, ai sẽ ngồi khóc?',
    hint: 'Thú nhận thật lòng xem ai tháo vát hơn nào...',
  },
  {
    id: 'q_fun_02',
    category: 'FUNNY',
    text: 'Thói quen kỳ quặc nào của đối phương mà bạn thấy vừa buồn cười vừa đáng yêu?',
    hint: 'Ví dụ: Lúc đói bụng, lúc ngủ gật hay lúc dỗi...',
  },
  {
    id: 'q_fun_03',
    category: 'FUNNY',
    text: 'Ấn tượng đầu tiên lúc mới gặp của bạn về đối phương sai lệch thế nào so với hiện tại?',
    hint: 'Lúc đầu tưởng lạnh lùng, ai dè...',
  },
  {
    id: 'q_fun_04',
    category: 'FUNNY',
    text: 'Nếu được đổi cơ thể cho nhau trong 24 giờ, việc đầu tiên bạn làm sẽ là gì?',
    hint: 'Cấm làm trò dìm hàng người yêu nhé!',
  },
  {
    id: 'q_fun_05',
    category: 'FUNNY',
    text: 'Món ăn nào đối phương cực kỳ thích nhưng bạn nhìn thấy là muốn chạy trốn?',
    hint: 'Sầu riêng, mắm tôm, hành lá hay trà sữa full topping?',
  },
  {
    id: 'q_fun_06',
    category: 'FUNNY',
    text: 'Nếu cuộc tình của hai đứa được dựng thành phim, tên bộ phim đó sẽ là gì và thuộc thể loại nào?',
    hint: 'Hài lãng mạn, hành động kịch tính hay phim hoạt hình?',
  },
  {
    id: 'q_fun_07',
    category: 'FUNNY',
    text: 'Câu nói cửa miệng nào của người yêu mà bạn nghe nhiều đến mức thuộc lòng luôn?',
    hint: '"Ăn gì cũng được", "Em không sao" hay một câu nào khác?',
  },
  {
    id: 'q_fun_08',
    category: 'FUNNY',
    text: 'Trong một trận zombie tấn công, bạn nghĩ hai đứa sẽ trụ được bao lâu và ai là người báo đồng đội?',
    hint: 'Đánh giá kỹ năng sinh tồn của đối phương!',
  },
  {
    id: 'q_fun_09',
    category: 'FUNNY',
    text: 'Bức ảnh dìm hàng huyền thoại nhất của người kia trong máy bạn được chụp trong hoàn cảnh nào?',
    hint: 'Miêu tả lại khoảnh khắc để đời đó xem nào.',
  },
  {
    id: 'q_fun_10',
    category: 'FUNNY',
    text: 'Nếu hai đứa cùng mở một quán ăn nhỏ, ai sẽ đứng bếp chính và ai sẽ làm chủ thu ngân kiêm ăn vụng?',
    hint: 'Phân chia chức vụ rõ ràng ngay từ bây giờ.',
  },

  // ================= 2. DEEP (TÂM SỰ SÂU LẮNG) =================
  {
    id: 'q_deep_01',
    category: 'DEEP',
    text: 'Khoảnh khắc nào trong thời gian qua khiến bạn thấy bình yên nhất khi ở cạnh nhau?',
    hint: 'Một buổi chiều mưa hay lúc tựa vai nhau trên xe...',
  },
  {
    id: 'q_deep_02',
    category: 'DEEP',
    text: 'Khi bạn buồn hoặc áp lực công việc, đối phương làm điều gì sẽ giúp bạn thấy nhẹ lòng nhất?',
    hint: 'Một cái ôm im lặng, lắng nghe hay rủ đi ăn món ngon?',
  },
  {
    id: 'q_deep_03',
    category: 'DEEP',
    text: 'Điều gì ở đối phương khiến bạn tự hào nhất mỗi khi kể với bạn bè hoặc gia đình?',
    hint: 'Sự tử tế, kiên nhẫn hay cách người ấy quan tâm bạn?',
  },
  {
    id: 'q_deep_04',
    category: 'DEEP',
    text: 'Từ khi yêu nhau, bạn cảm thấy bản thân mình đã thay đổi tích cực nhất ở điểm nào?',
    hint: 'Biết lắng nghe hơn, kiên nhẫn hơn hay sống có mục tiêu hơn?',
  },
  {
    id: 'q_deep_05',
    category: 'DEEP',
    text: 'Có điều gì bạn từng rất sợ nói ra nhưng nhờ sự thấu hiểu của người ấy mà bạn đã mở lòng được không?',
    hint: 'Chia sẻ cảm giác được an toàn khi ở bên người ấy.',
  },
  {
    id: 'q_deep_06',
    category: 'DEEP',
    text: 'Khi hai đứa giận nhau, hành động làm hòa nào của đối phương khiến bạn mềm lòng ngay lập tức?',
    hint: 'Ánh mắt hối lỗi, tin nhắn xin lỗi dài hay mua đồ ăn tới?',
  },
  {
    id: 'q_deep_07',
    category: 'DEEP',
    text: 'Nỗi lo lắng lớn nhất hiện tại của bạn trong cuộc sống là gì, và người ấy có thể đồng hành cùng bạn thế nào?',
    hint: 'Hãy để đối phương hiểu thêm gánh nặng bạn đang mang.',
  },
  {
    id: 'q_deep_08',
    category: 'DEEP',
    text: 'Nếu được gửi một lời cảm ơn chân thành nhất cho đối phương vì một việc trong tháng qua, bạn sẽ nói gì?',
    hint: 'Đừng ngại viết ra điều bạn vẫn giữ trong lòng.',
  },
  {
    id: 'q_deep_09',
    category: 'DEEP',
    text: 'Theo bạn, nguyên tắc quan trọng nhất để giữ lửa và sự tin tưởng giữa hai đứa là gì?',
    hint: 'Sự thành thật, chia sẻ mỗi ngày hay tôn trọng khoảng riêng?',
  },
  {
    id: 'q_deep_10',
    category: 'DEEP',
    text: 'Đâu là lúc bạn nhận ra đối phương thực sự là một phần không thể thiếu trong cuộc sống của mình?',
    hint: 'Một biến cố hay một khoảnh khắc đời thường rất nhỏ?',
  },

  // ================= 3. MEMORIES (KỶ NIỆM HAI ĐỨA) =================
  {
    id: 'q_mem_01',
    category: 'MEMORIES',
    text: 'Buổi hẹn hò đầu tiên của hai đứa trong ký ức của bạn diễn ra như thế nào? Có chi tiết nào hồi hộp không?',
    hint: 'Nhớ lại bộ đồ hôm đó mặc và quán hai đứa đã ngồi.',
  },
  {
    id: 'q_mem_02',
    category: 'MEMORIES',
    text: 'Món quà hoặc bất ngờ nào từ đối phương làm bạn nhớ mãi cho tới tận bây giờ?',
    hint: 'Không cần đắt tiền, miễn là chạm đúng trái tim.',
  },
  {
    id: 'q_mem_03',
    category: 'MEMORIES',
    text: 'Chuyến đi chơi xa hoặc buổi đi dạo nào của hai đứa mà bạn muốn được quay lại trải nghiệm thêm lần nữa?',
    hint: 'Cơn mưa bất chợt, lạc đường hay cảnh hoàng hôn hôm ấy?',
  },
  {
    id: 'q_mem_04',
    category: 'MEMORIES',
    text: 'Tin nhắn đầu tiên hai đứa nhắn cho nhau là gì, lúc đó ai là người chủ động bắt chuyện trước?',
    hint: 'Thử trí nhớ xem ai còn nhớ chính xác hoàn cảnh lúc đó!',
  },
  {
    id: 'q_mem_05',
    category: 'MEMORIES',
    text: 'Khoảnh khắc nắm tay hoặc cái ôm đầu tiên của hai đứa diễn ra ở đâu, cảm giác lúc đó thế nào?',
    hint: 'Tim đập nhanh cỡ nào lúc chạm tay nhau?',
  },
  {
    id: 'q_mem_06',
    category: 'MEMORIES',
    text: 'Bữa ăn nào hai đứa đi ăn cùng nhau mà vừa ngon vừa nhiều chuyện vui nhất từ trước tới giờ?',
    hint: 'Một quán vỉa hè quen thuộc hay bữa tối kỷ niệm?',
  },
  {
    id: 'q_mem_07',
    category: 'MEMORIES',
    text: 'Có lần nào hai đứa gặp sự cố dở khóc dở cười khi đi chơi (hết xăng, mắc mưa, đi nhầm đường) mà nghĩ lại vẫn thấy vui không?',
    hint: 'Những kỷ niệm nhớ đời không có trong kế hoạch.',
  },
  {
    id: 'q_mem_08',
    category: 'MEMORIES',
    text: 'Bài hát hoặc giai điệu nào cứ vang lên là bạn lập tức nhớ tới một kỷ niệm với người ấy?',
    hint: 'Bài hát hai đứa hay nghêu ngao trên xe.',
  },
  {
    id: 'q_mem_09',
    category: 'MEMORIES',
    text: 'Đâu là bức ảnh chụp chung mà bạn thích nhất trong toàn bộ Album của hai đứa? Vì sao?',
    hint: 'Nụ cười tự nhiên hay khung cảnh hôm đó quá đẹp?',
  },
  {
    id: 'q_mem_10',
    category: 'MEMORIES',
    text: 'Kỷ niệm sinh nhật hoặc ngày lễ nào bên nhau khiến bạn cảm thấy ấm áp và trọn vẹn nhất?',
    hint: 'Chiếc bánh kem nhỏ hay lời chúc lúc 0h đêm?',
  },

  // ================= 4. INTIMACY (NGỌT NGÀO & LÃNG MẠN) =================
  {
    id: 'q_int_01',
    category: 'INTIMACY',
    text: 'Cử chỉ thân mật nhỏ nhặt nào của người yêu (xoa đầu, nắm tay, ôm từ phía sau, hôn trán) làm bạn thích nhất?',
    hint: 'Bật mí để người kia làm thường xuyên hơn nhé!',
  },
  {
    id: 'q_int_02',
    category: 'INTIMACY',
    text: 'Khoảnh khắc nào trong ngày nhìn người yêu mà bạn thấy đối phương cuốn hút và đáng yêu nhất?',
    hint: 'Lúc đang tập trung làm việc, lúc mới ngủ dậy hay lúc cười tít mắt?',
  },
  {
    id: 'q_int_03',
    category: 'INTIMACY',
    text: 'Trong 5 ngôn ngữ tình yêu (Lời khen, Thời gian chất lượng, Quà tặng, Hành động chăm sóc, Cử chỉ âu yếm), bạn thích nhận được điều nào nhất?',
    hint: 'Giúp đối phương yêu bạn đúng cách bạn mong muốn.',
  },
  {
    id: 'q_int_04',
    category: 'INTIMACY',
    text: 'Biệt danh hoặc cách xưng hô nào giữa hai đứa làm bạn thấy ngọt ngào nhất khi nghe?',
    hint: 'Cách gọi riêng chỉ hai người mới biết.',
  },
  {
    id: 'q_int_05',
    category: 'INTIMACY',
    text: 'Nếu tối nay hai đứa có một buổi hẹn hò hoàn hảo chỉ riêng hai người, bạn muốn buổi tối đó diễn ra như thế nào?',
    hint: 'Nấu ăn cùng nhau, xem phim dưới ánh nến hay đi dạo đêm?',
  },
  {
    id: 'q_int_06',
    category: 'INTIMACY',
    text: 'Mùi hương hoặc đặc điểm nào trên người đối phương khiến bạn cảm thấy thân thuộc và dễ chịu nhất?',
    hint: 'Mùi nước hoa, mùi nắng hay mùi dầu gội quen thuộc?',
  },
  {
    id: 'q_int_07',
    category: 'INTIMACY',
    text: 'Lời khen nào từ người yêu từng làm bạn vui âm ỉ suốt cả tuần liền?',
    hint: 'Một câu khen đúng lúc có sức mạnh cực lớn.',
  },
  {
    id: 'q_int_08',
    category: 'INTIMACY',
    text: 'Khi phải xa nhau vài ngày, điều gì ở đối phương làm bạn thấy nhớ cồn cào nhất?',
    hint: 'Giọng nói, những tin nhắn trêu chọc hay cảm giác được dựa vào nhau?',
  },
  {
    id: 'q_int_09',
    category: 'INTIMACY',
    text: 'Điểm nào trên khuôn mặt của người yêu mà bạn thích ngắm nhìn lâu nhất?',
    hint: 'Đôi mắt, nụ cười hay má lúm đồng tiền?',
  },
  {
    id: 'q_int_10',
    category: 'INTIMACY',
    text: 'Hãy viết 3 tính từ miêu tả chính xác nhất cảm giác của bạn mỗi khi được người ấy ôm chặt.',
    hint: 'Ấm áp, bình yên, rung động hay...?',
  },

  // ================= 5. FUTURE (TƯƠNG LAI & DỰ ĐỊNH) =================
  {
    id: 'q_fut_01',
    category: 'FUTURE',
    text: 'Địa điểm du lịch nào mà hai đứa nhất định phải cùng nhau đặt chân tới trong 1 năm tới?',
    hint: 'Săn mây Đà Lạt, ngắm biển Phú Quốc hay một chuyến đi nước ngoài?',
  },
  {
    id: 'q_fut_02',
    category: 'FUTURE',
    text: 'Ngôi nhà mơ ước trong tương lai của hai đứa sẽ có góc nhỏ nào đặc biệt nhất?',
    hint: 'Căn bếp ấm cúng, ban công đầy cây xanh hay phòng chiếu phim mini?',
  },
  {
    id: 'q_fut_03',
    category: 'FUTURE',
    text: 'Hình dung của bạn về một ngày cuối tuần lý tưởng của hai đứa sau 5 năm nữa sẽ như thế nào?',
    hint: 'Thức dậy muộn, pha cà phê, nấu ăn cùng nhau và...',
  },
  {
    id: 'q_fut_04',
    category: 'FUTURE',
    text: 'Nếu hai đứa nuôi thú cưng chung, bạn muốn nuôi một bé cún, một bé mèo hay thú cưng gì và đặt tên là gì?',
    hint: 'Chọn tên cho thành viên nhỏ tương lai của nhà mình nào.',
  },
  {
    id: 'q_fut_05',
    category: 'FUTURE',
    text: 'Mục tiêu tài chính hoặc khoản tiết kiệm chung nào mà bạn muốn hai đứa cùng hoàn thành sớm nhất?',
    hint: 'Quỹ du lịch, quỹ mua món đồ chung hay quỹ tương lai lâu dài?',
  },
  {
    id: 'q_fut_06',
    category: 'FUTURE',
    text: 'Khi về chung một nhà, công việc nhà nào bạn xung phong nhận làm, và việc nào bạn muốn nhờ người ấy gánh giúp?',
    hint: 'Nấu cơm vs Rửa bát, Giặt đồ vs Quét nhà?',
  },
  {
    id: 'q_fut_07',
    category: 'FUTURE',
    text: 'Truyền thống kỷ niệm nào bạn muốn hai đứa duy trì đều đặn mỗi năm dù sau này bận rộn đến đâu?',
    hint: 'Chụp một bộ ảnh kỷ niệm, đi du lịch đúng ngày yêu nhau hay viết thư tay?',
  },
  {
    id: 'q_fut_08',
    category: 'FUTURE',
    text: 'Có kỹ năng hoặc sở thích mới nào (như nấu ăn, chụp ảnh, chơi thể thao, học ngoại ngữ) mà bạn muốn hai đứa cùng học chung không?',
    hint: 'Cùng nhau trải nghiệm một điều mới mẻ.',
  },
  {
    id: 'q_fut_09',
    category: 'FUTURE',
    text: 'Khi hai đứa già đi ở tuổi 70, bạn tưởng tượng hai ông bà sẽ hay ngồi tâm sự chuyện gì với nhau?',
    hint: 'Ngồi ghế gỗ uống trà và ôn lại thời trẻ sôi nổi...',
  },
  {
    id: 'q_fut_10',
    category: 'FUTURE',
    text: 'Trong 3 tháng tới, có một ước muốn nhỏ nào bạn muốn hai đứa cùng thực hiện vào dịp cuối tuần không?',
    hint: 'Một buổi picnic, đi làm gốm hay đi xem concert?',
  },

  // ================= 6. DILEMMA (TÌNH HUỐNG KHÓ ĐỠ) =================
  {
    id: 'q_dil_01',
    category: 'DILEMMA',
    text: 'Nếu người yêu nấu một món ăn mới cực kỳ tâm huyết nhưng bị mặn chát, bạn sẽ khen ngon rồi ăn hết hay góp ý thẳng?',
    hint: 'Chọn bảo toàn tính mạng hay chọn sự thật?',
  },
  {
    id: 'q_dil_02',
    category: 'DILEMMA',
    text: 'Giữa việc không được nhắn tin cho nhau 1 tuần và không được gặp mặt trực tiếp 1 tháng, điều nào khó chịu hơn với bạn?',
    hint: 'Suy nghĩ kỹ trước khi chốt đáp án nhé!',
  },
  {
    id: 'q_dil_03',
    category: 'DILEMMA',
    text: 'Nếu trúng số độc đắc nhưng điều kiện là phải giữ bí mật tuyệt đối trong 24 giờ đầu, bạn có nhịn được không kể cho người yêu nghe không?',
    hint: 'Nhìn mặt nhau có giấu nổi niềm vui không?',
  },
  {
    id: 'q_dil_04',
    category: 'DILEMMA',
    text: 'Khi đi xem phim hoặc đi ăn mà đối phương ngủ gật ngon lành trên vai bạn, bạn sẽ gọi dậy hay để yên cho ngủ tiếp?',
    hint: 'Vừa thương vừa buồn cười thì xử lý sao?',
  },
  {
    id: 'q_dil_05',
    category: 'DILEMMA',
    text: 'Nếu bắt buộc phải chọn: Đi du lịch sang chảnh 5 sao nhưng lịch trình kín mít hay đi homestay bình dân nhưng nằm dài nghỉ dưỡng bên nhau?',
    hint: 'Khám phá hết mình hay nằm lười bên nhau?',
  },
  {
    id: 'q_dil_06',
    category: 'DILEMMA',
    text: 'Nếu người yêu bất ngờ đòi cắt một kiểu tóc cực kỳ độc lạ, bạn sẽ cổ vũ hết mình hay tìm cách khuyên ngăn?',
    hint: 'Tôn trọng đam mê hay cứu vãn nhan sắc?',
  },
  {
    id: 'q_dil_07',
    category: 'DILEMMA',
    text: 'Nếu có cỗ máy thời gian chỉ dùng được 1 lần: Bạn chọn quay về lúc hai đứa mới tán tỉnh nhau hay bay tới 10 năm sau xem tương lai?',
    hint: 'Tò mò về tương lai hay hoài niệm cảm giác mới yêu?',
  },
  {
    id: 'q_dil_08',
    category: 'DILEMMA',
    text: 'Khi hai đứa bất đồng ý kiến về một chuyện nhỏ nhặt (như chọn chỗ ăn tối), bạn thường là người nhường hay người quyết định?',
    hint: 'Xem hai đứa có tự nhận giống nhau không nào!',
  },
  {
    id: 'q_dil_09',
    category: 'DILEMMA',
    text: 'Nếu chỉ được giữ lại 3 vật dụng khi đi cắm trại qua đêm cùng người yêu trên núi, bạn sẽ mang theo những gì?',
    hint: 'Đồ ăn, chăn ấm, máy ảnh hay sạc dự phòng?',
  },
  {
    id: 'q_dil_10',
    category: 'DILEMMA',
    text: 'Nếu đọc được suy nghĩ của người yêu trong đúng 10 phút, bạn muốn đọc vào lúc nào nhất?',
    hint: 'Lúc người ấy đang dỗi, lúc đang chọn quà hay lúc đang nhìn bạn?',
  },
];